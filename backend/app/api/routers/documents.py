import uuid
import os
import mimetypes
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.batch import Batch
from app.models.user import User
from app.schemas.document import (
    CanonicalDocument,
    DocumentListItem,
    FieldCorrectionRequest,
    BatchFieldCorrectionRequest,
    OfficerEditRequest,
    RejectRequest,
    EscalateRequest
)
from app.dependencies import get_current_user, require_role
from app.services.storage_service import storage_service
from app.services.document_service import DocumentService

router = APIRouter(tags=["Documents"])

@router.post("/batches/{batch_id}/documents", status_code=status.HTTP_201_CREATED, summary="Upload Scanned Land Records")
def upload_documents(
    batch_id: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    """
    Accepts scanned land records (PDF, JPG, JPEG, PNG, TIFF).
    Saves original scans immutably, registers records in 'queued' status,
    and returns HTTP 201 immediately. Background OCR worker extracts fields asynchronously
    eliminating HTTP timeouts during batch uploads.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    created_docs = []
    for file in files:
        ext = file.filename.split(".")[-1].lower()
        if ext not in ["jpg", "jpeg", "png", "pdf", "tif", "tiff"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{file.filename}'. Allowed: PDF, JPG, JPEG, PNG, TIFF."
            )

        storage_path, public_url, file_size = storage_service.save_upload(file)
        doc_id = str(uuid.uuid4())

        # Register immediately with 'queued' status
        doc = DocumentService.register_queued_document(
            db=db,
            document_id=doc_id,
            batch_id=batch_id,
            filename=file.filename,
            storage_path=storage_path,
            public_url=public_url,
            file_size_bytes=file_size,
            creator=current_user
        )

        # Offload OCR, layout detection & field mapping to background task
        background_tasks.add_task(
            DocumentService.execute_async_extraction,
            document_id=doc.id,
            batch_id=batch_id,
            filename=file.filename,
            storage_path=storage_path,
            creator_id=current_user.id,
            creator_email=current_user.email,
            creator_role=current_user.role
        )

        created_docs.append({
            "document_id": doc.id,
            "batch_id": batch_id,
            "filename": doc.filename,
            "status": "queued",
            "overall_confidence": 0.0,
            "message": "Scan securely stored; asynchronous OCR extraction started."
        })

    batch.total_documents = db.query(Document).filter(Document.batch_id == batch_id).count()
    db.commit()

    return {
        "batch_id": batch_id,
        "uploaded_count": len(created_docs),
        "status": "queued",
        "documents": created_docs
    }

@router.get("/documents", response_model=List[DocumentListItem], summary="List Documents with Role-based Filters")
def list_documents(
    batch_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    district: Optional[str] = None,
    village: Optional[str] = None,
    land_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    is_duplicate: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy.orm import joinedload
    
    query = db.query(Document).options(joinedload(Document.fields))
    if batch_id:
        query = query.filter(Document.batch_id == batch_id)
    if status_filter:
        query = query.filter(Document.status == status_filter)
    if land_type:
        query = query.filter(Document.land_type == land_type)
    if is_duplicate is not None:
        query = query.filter(Document.is_duplicate == is_duplicate)
    if from_date:
        try:
            fd = datetime.datetime.fromisoformat(from_date.replace("Z", ""))
            query = query.filter(Document.created_at >= fd)
        except Exception:
            pass
    if to_date:
        try:
            td = datetime.datetime.fromisoformat(to_date.replace("Z", ""))
            query = query.filter(Document.created_at <= td)
        except Exception:
            pass

    docs = query.order_by(Document.created_at.desc()).all()
    results = []

    for d in docs:
        fields_by_name = {f.field_name: f.value for f in d.fields}
        v_name = fields_by_name.get("village")
        d_name = fields_by_name.get("district")

        if village and v_name and village.lower() not in v_name.lower():
            continue
        if district and d_name and district.lower() not in d_name.lower():
            continue

        results.append(DocumentListItem(
            id=d.id,
            batch_id=d.batch_id,
            filename=d.filename,
            status=d.status,
            overall_confidence=d.overall_confidence,
            original_scan_url=d.original_scan_url,
            created_at=d.created_at,
            updated_at=d.updated_at,
            owner_name=fields_by_name.get("owner_name"),
            khasra_number=fields_by_name.get("khasra_number"),
            village=v_name,
            district=d_name,
            external_lrms_id=d.external_lrms_id,
            is_duplicate=bool(getattr(d, "is_duplicate", False)),
            duplicate_of_id=getattr(d, "duplicate_of_id", None),
            land_type=getattr(d, "land_type", "Agricultural") or "Agricultural"
        ))

    return results

@router.get("/documents/{document_id}", summary="Get Canonical Land Record by ID")
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DocumentService.get_canonical_document(db, document_id)

@router.get("/documents/{document_id}/scan", summary="Authenticated & Authorized Scan File Streaming")
def get_document_scan(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Secure document scan retrieval.
    Transparently decrypts encrypted scan bytes from immutable storage,
    never exposing plaintext files publicly.
    """
    from fastapi.responses import Response
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    storage_path = doc.storage_path
    safe_filename = os.path.basename(doc.filename)
    if not storage_path or not os.path.exists(storage_path):
        this_dir = os.path.dirname(__file__)
        candidate_dirs = [
            settings.ORIGINAL_SCANS_DIR,
            os.path.abspath(os.path.join(this_dir, "..", "..", "storage", "original_scans")),
            os.path.abspath(os.path.join(this_dir, "..", "..", "..", "storage", "original_scans")),
            os.path.abspath(os.path.join(this_dir, "..", "..", "..", "..", "storage", "original_scans")),
            os.path.abspath(os.path.join(this_dir, "..", "..", "..", "..", "data")),
            os.path.abspath(os.path.join(this_dir, "..", "..", "..", "sample-data", "documents")),
            os.path.abspath(os.path.join(this_dir, "..", "..", "..", "..", "sample-data", "documents")),
        ]
        found = None
        for cdir in candidate_dirs:
            p = os.path.join(cdir, safe_filename)
            if os.path.exists(p):
                found = p
                break
        if found:
            storage_path = found
        else:
            raise HTTPException(status_code=404, detail=f"Original scan file '{safe_filename}' not found in storage")

    mime_type, _ = mimetypes.guess_type(storage_path)
    decrypted_bytes = storage_service.get_file_bytes(storage_path)

    return Response(
        content=decrypted_bytes,
        media_type=mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'inline; filename="{doc.filename}"',
            "Cache-Control": "private, no-cache, no-store, must-revalidate"
        }
    )

@router.patch("/documents/{document_id}/officer-edit", summary="Officer Adds or Edits Difference")
def officer_edit_document(
    document_id: str,
    req: OfficerEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["officer", "admin"]))
):
    """
    Allows Officer to record differences, update extracted field values,
    and log the exact edit to the immutable SHA-256 audit ledger.
    """
    return DocumentService.officer_edit_field(
        db=db,
        document_id=document_id,
        field_name=req.field_name,
        new_value=req.new_value if req.new_value is not None else (req.value or ""),
        unit=req.unit,
        officer=current_user,
        reason=req.reason or "Officer discrepancy adjustment"
    )

@router.patch("/documents/{document_id}/fields", summary="Human Operator Corrects Extracted Fields")
def correct_fields(
    document_id: str,
    req: BatchFieldCorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "officer", "admin"]))
):
    """
    Updates field values, sets source to 'corrected', elevates confidence to 100%,
    and logs the change in the immutable audit trail.
    """
    last_doc = None
    for item in req.corrections:
        last_doc = DocumentService.correct_field(
            db=db,
            document_id=document_id,
            field_name=item.field_name,
            new_value=item.value,
            unit=item.unit,
            user=current_user
        )
    return last_doc or DocumentService.get_canonical_document(db, document_id)

@router.post("/documents/{document_id}/submit", summary="Submit Verified Record for Officer Approval")
def submit_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    """
    Submits record to officer queue.
    Strictly blocked if any field with confidence < 60% is uncorrected.
    """
    return DocumentService.submit_for_approval(db, document_id, current_user)

@router.post("/documents/{document_id}/approve", summary="Officer Approves and Syncs to LRMS")
def approve_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["officer", "admin"]))
):
    """
    Runs final validation, commits to Mock LRMS Gateway via LRMSAdapter,
    and returns External ID.
    """
    return DocumentService.approve_document(db, document_id, current_user)

@router.post("/documents/{document_id}/reject", summary="Officer Rejects Record with Mandatory Reason")
def reject_document(
    document_id: str,
    req: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["officer", "admin"]))
):
    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory")
    return DocumentService.reject_document(db, document_id, req.reason.strip(), current_user)

@router.post("/batches/{batch_id}/approve-all", summary="Officer Bulk Approves All Reviewed Records in a Batch")
def approve_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["officer", "admin"]))
):
    """
    Scalable Bulk Action: Approves all documents in 'reviewed' status within the batch
    and syncs them to LRMS in a single operation.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    docs = db.query(Document).filter(
        Document.batch_id == batch_id,
        Document.status == "reviewed"
    ).all()

    approved_list = []
    errors_list = []

    for doc in docs:
        try:
            # Enforce Section 1.4 & Rule 7: Prevent bulk approval of unverified low-confidence records
            uncorrected = db.query(ExtractedField).filter(
                ExtractedField.document_id == doc.id,
                ExtractedField.confidence < 60.0,
                ExtractedField.source == "auto"
            ).first()

            if uncorrected:
                errors_list.append({
                    "document_id": doc.id,
                    "error": f"Document has unverified low-confidence field '{uncorrected.field_name}' ({uncorrected.confidence}%). Bulk approval blocked."
                })
                continue

            res = DocumentService.approve_document(db, doc.id, current_user)
            approved_list.append({
                "document_id": doc.id,
                "external_id": res.get("external_lrms_id")
            })
        except Exception as e:
            errors_list.append({
                "document_id": doc.id,
                "error": str(e)
            })

    return {
        "batch_id": batch_id,
        "total_eligible": len(docs),
        "approved_count": len(approved_list),
        "failed_count": len(errors_list),
        "approved": approved_list,
        "errors": errors_list
    }
