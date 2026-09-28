import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.batch import Batch
from app.models.document import Document
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.batch import BatchCreate, BatchOut, BatchWithStats
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.post("", response_model=BatchOut, status_code=status.HTTP_201_CREATED, summary="Create Land Record Batch")
def create_batch(
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    batch = Batch(
        name=batch_in.name,
        state=batch_in.state,
        district=batch_in.district,
        tehsil=batch_in.tehsil,
        village=batch_in.village,
        created_by=current_user.id
    )
    db.add(batch)
    
    # Cryptographically hash-chained Audit log
    from app.services.audit_service import AuditService
    AuditService.record_audit_log(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        role=current_user.role,
        action="BATCH_CREATED",
        batch_id=batch.id,
        new_value=f"Created batch '{batch.name}' for {batch.village}, {batch.tehsil}, {batch.district}"
    )
    db.commit()
    db.refresh(batch)

    # Mirror batch to Supabase Cloud
    try:
        from app.services.supabase_service import supabase_service
        supabase_service.mirror_upsert("batches", {
            "id": batch.id,
            "name": batch.name,
            "state": batch.state,
            "district": batch.district,
            "tehsil": batch.tehsil,
            "village": batch.village,
            "status": batch.status,
            "total_documents": 0,
            "created_by": batch.created_by,
            "created_at": batch.created_at.isoformat() if batch.created_at else None
        })
    except Exception:
        pass

    return batch

@router.get("", response_model=List[BatchWithStats], summary="List Batches with Real-time Progress")
def list_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batches = db.query(Batch).order_by(Batch.created_at.desc()).all()
    results = []
    
    for b in batches:
        docs = db.query(Document).filter(Document.batch_id == b.id).all()
        total = len(docs)
        processed = sum(1 for d in docs if d.status in ["needs_review", "reviewed", "approved", "pushed_to_lrms"])
        needs_review = sum(1 for d in docs if d.status == "needs_review")
        approved = sum(1 for d in docs if d.status in ["approved", "pushed_to_lrms"])
        
        confs = [d.overall_confidence for d in docs if d.overall_confidence > 0]
        avg_c = round(sum(confs) / len(confs), 1) if confs else 0.0

        b_dict = {
            "id": b.id,
            "name": b.name,
            "state": b.state,
            "district": b.district,
            "tehsil": b.tehsil,
            "village": b.village,
            "status": b.status,
            "total_documents": total,
            "created_by": b.created_by,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "processed_count": processed,
            "needs_review_count": needs_review,
            "approved_count": approved,
            "avg_confidence": avg_c
        }
        results.append(b_dict)
    
    return results

@router.get("/{batch_id}", response_model=BatchWithStats, summary="Get Batch Details")
def get_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Batch).filter(Batch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")

    docs = db.query(Document).filter(Document.batch_id == b.id).all()
    total = len(docs)
    processed = sum(1 for d in docs if d.status in ["needs_review", "reviewed", "approved", "pushed_to_lrms"])
    needs_review = sum(1 for d in docs if d.status == "needs_review")
    approved = sum(1 for d in docs if d.status in ["approved", "pushed_to_lrms"])
    
    confs = [d.overall_confidence for d in docs if d.overall_confidence > 0]
    avg_c = round(sum(confs) / len(confs), 1) if confs else 0.0

    return {
        "id": b.id,
        "name": b.name,
        "state": b.state,
        "district": b.district,
        "tehsil": b.tehsil,
        "village": b.village,
        "status": b.status,
        "total_documents": total,
        "created_by": b.created_by,
        "created_at": b.created_at,
        "updated_at": b.updated_at,
        "processed_count": processed,
        "needs_review_count": needs_review,
        "approved_count": approved,
        "avg_confidence": avg_c
    }
