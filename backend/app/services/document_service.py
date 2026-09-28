import os
import json
import datetime
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.validation_result import ValidationResult
from app.models.audit_log import AuditLog
from app.models.lrms_push_log import LRMSPushLog
from app.models.notification import Notification
from app.models.batch import Batch
from app.models.user import User

from app.validation.engine import ValidationEngine
from app.adapters.mock_lrms_adapter import lrms_adapter
from app.services.ml_client import ml_client
from app.services.webhook_service import webhook_service
from app.services.audit_service import AuditService

class DocumentService:
    @staticmethod
    def register_queued_document(
        db: Session,
        document_id: str,
        batch_id: str,
        filename: str,
        storage_path: str,
        public_url: str,
        file_size_bytes: int,
        creator: User
    ) -> Document:
        """
        Immediately registers uploaded scan in 'queued' status so upload endpoint returns instantly without HTTP timeout.
        """
        doc = Document(
            id=document_id,
            batch_id=batch_id,
            filename=filename,
            file_size_bytes=file_size_bytes,
            original_scan_url=f"/api/v1/documents/{document_id}/scan",
            storage_path=storage_path,
            status="queued",
            overall_confidence=0.0
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Mirror immediately to Supabase Cloud
        try:
            from app.services.supabase_service import supabase_service
            supabase_service.mirror_upsert("documents", {
                "id": doc.id,
                "batch_id": doc.batch_id,
                "filename": doc.filename,
                "file_size_bytes": doc.file_size_bytes,
                "mime_type": doc.mime_type or "application/pdf",
                "original_scan_url": doc.original_scan_url,
                "storage_path": doc.storage_path,
                "status": doc.status,
                "overall_confidence": doc.overall_confidence,
                "created_at": doc.created_at.isoformat() if doc.created_at else None
            })
        except Exception:
            pass

        return doc

    @staticmethod
    def execute_async_extraction(
        document_id: str,
        batch_id: str,
        filename: str,
        storage_path: str,
        creator_id: str,
        creator_email: str,
        creator_role: str
    ):
        """
        Background extraction worker: runs OCR, layout parsing, rule validation, and audit recording asynchronously.
        """
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if not doc:
                return

            doc.status = "processing"
            db.commit()

            # 1. Fetch batch metadata for context
            batch = db.query(Batch).filter(Batch.id == batch_id).first()
            batch_meta = {
                "state": batch.state if batch else "Uttar Pradesh",
                "district": batch.district if batch else "Varanasi",
                "tehsil": batch.tehsil if batch else "Sadar",
                "village": batch.village if batch else "Rampur",
                "filename": filename
            }

            # 2. Call ML Service extraction
            extraction_res = ml_client.extract_document(
                document_id=doc.id,
                batch_id=batch_id,
                file_path=storage_path,
                metadata=batch_meta
            )

            extracted_fields = extraction_res.get("fields", {})
            overall_conf = extraction_res.get("overall_confidence", 85.0)
            initial_status = extraction_res.get("status", "needs_review")

            # 3. Save ExtractedField records
            for fname, fdata in extracted_fields.items():
                f_val = fdata.get("value")
                f_conf = float(fdata.get("confidence", 0.0))
                f_src = fdata.get("source", "auto")
                f_unit = fdata.get("unit")

                field_rec = ExtractedField(
                    document_id=doc.id,
                    field_name=fname,
                    ai_value=f_val,
                    ai_confidence=f_conf,
                    value=f_val,
                    confidence=f_conf,
                    source=f_src,
                    unit=f_unit
                )
                db.add(field_rec)

            # Auto-update location attributes on batch from verified document text
            doc_dist = extracted_fields.get("district", {}).get("value")
            doc_teh = extracted_fields.get("tehsil", {}).get("value")
            doc_vil = extracted_fields.get("village", {}).get("value")
            if batch:
                if doc_dist and ("district" in batch.district.lower() or not batch.district or "varanasi" in batch.district.lower()):
                    batch.district = doc_dist
                if doc_teh and ("taluka" in batch.tehsil.lower() or not batch.tehsil or "sadar" in batch.tehsil.lower()):
                    batch.tehsil = doc_teh
                if doc_vil and ("village" in batch.village.lower() or not batch.village or "rampur" in batch.village.lower()):
                    batch.village = doc_vil

            # 4. Check for duplicate document in database (Survey/Khasra match)
            khasra_val = extracted_fields.get("khasra_number", {}).get("value") or extracted_fields.get("survey_number", {}).get("value")
            if khasra_val:
                clean_khasra = str(khasra_val).split()[0].replace("(", "").replace(")", "").strip()
                existing_match = db.query(Document).join(ExtractedField).filter(
                    Document.id != doc.id,
                    ExtractedField.field_name.in_(["khasra_number", "survey_number"]),
                    ExtractedField.value.ilike(f"%{clean_khasra}%")
                ).first()
                if existing_match:
                    doc.is_duplicate = True
                    doc.duplicate_of_id = existing_match.id

            # 5. Classify Agricultural vs Non-Agricultural
            land_type_val = extraction_res.get("land_type") or extracted_fields.get("land_type", {}).get("value")
            if not land_type_val:
                vals_joined = " ".join([str(f.get("value", "")) for f in extracted_fields.values()])
                if any(k in vals_joined for k in ["अकृषिक", "N.A.", "नगर भूमापन", "बिगरशेती", "निवासी", "वाणिज्यिक"]):
                    land_type_val = "Non-Agricultural"
                else:
                    land_type_val = "Agricultural"
            doc.land_type = land_type_val
            doc.is_encrypted = True

            doc.overall_confidence = overall_conf
            doc.status = initial_status
            db.commit()

            # 6. Run Validation Engine
            val_summary = ValidationEngine.validate_document(db, doc.id, extracted_fields)
            for r in val_summary["results"]:
                v_res = ValidationResult(
                    document_id=doc.id,
                    rule_name=r["rule_name"],
                    severity=r["severity"],
                    message=r["message"],
                    field_name=r.get("field_name"),
                    is_blocking=r.get("is_blocking", False),
                    details=r.get("details")
                )
                db.add(v_res)

            # 7. Record Cryptographically Chained Audit Log
            AuditService.record_audit_log(
                db=db,
                user_id=creator_id,
                user_email=creator_email,
                role=creator_role,
                action="DOCUMENT_UPLOADED",
                document_id=doc.id,
                batch_id=batch_id,
                new_value=f"Uploaded {filename} with accuracy {overall_conf}%, type: {doc.land_type}"
            )
            db.commit()

            # Mirror extraction results & fields to Supabase Cloud
            try:
                from app.services.supabase_service import supabase_service
                supabase_service.mirror_upsert("documents", {
                    "id": doc.id,
                    "batch_id": doc.batch_id,
                    "filename": doc.filename,
                    "file_size_bytes": doc.file_size_bytes,
                    "mime_type": doc.mime_type or "application/pdf",
                    "original_scan_url": doc.original_scan_url,
                    "storage_path": doc.storage_path,
                    "status": doc.status,
                    "overall_confidence": doc.overall_confidence,
                    "updated_at": datetime.datetime.utcnow().isoformat()
                })
                for fname, fdata in extracted_fields.items():
                    supabase_service.mirror_upsert("extracted_fields", {
                        "document_id": doc.id,
                        "field_name": fname,
                        "ai_value": str(fdata.get("value") or ""),
                        "ai_confidence": float(fdata.get("confidence", 0.0)),
                        "value": str(fdata.get("value") or ""),
                        "confidence": float(fdata.get("confidence", 0.0)),
                        "source": fdata.get("source", "auto"),
                        "unit": fdata.get("unit")
                    })
            except Exception:
                pass

        except Exception as e:
            print(f"Error in background OCR extraction for document {document_id}: {e}")
            if doc:
                doc.status = "needs_review"
                db.commit()
        finally:
            db.close()

    @staticmethod
    def process_new_document(
        db: Session,
        document_id: str,
        batch_id: str,
        filename: str,
        storage_path: str,
        public_url: str,
        file_size_bytes: int,
        creator: User
    ) -> Document:
        """
        Synchronous fallback / direct processor.
        """
        doc = DocumentService.register_queued_document(
            db=db,
            document_id=document_id,
            batch_id=batch_id,
            filename=filename,
            storage_path=storage_path,
            public_url=public_url,
            file_size_bytes=file_size_bytes,
            creator=creator
        )
        DocumentService.execute_async_extraction(
            document_id=document_id,
            batch_id=batch_id,
            filename=filename,
            storage_path=storage_path,
            creator_id=creator.id,
            creator_email=creator.email,
            creator_role=creator.role
        )
        db.refresh(doc)
        return doc

    @staticmethod
    def get_canonical_document(db: Session, document_id: str) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
        fields_dict = {}
        for f in fields:
            fields_dict[f.field_name] = {
                "value": f.value,
                "confidence": f.confidence,
                "source": f.source,
                "unit": f.unit,
                "ai_value": f.ai_value,
                "ai_confidence": f.ai_confidence
            }

        return {
            "document_id": doc.id,
            "batch_id": doc.batch_id,
            "filename": doc.filename,
            "fields": fields_dict,
            "overall_confidence": doc.overall_confidence,
            "status": doc.status,
            "original_scan_url": doc.original_scan_url,
            "external_lrms_id": doc.external_lrms_id,
            "rejection_reason": doc.rejection_reason,
            "is_duplicate": bool(getattr(doc, "is_duplicate", False)),
            "duplicate_of_id": getattr(doc, "duplicate_of_id", None),
            "land_type": getattr(doc, "land_type", "Agricultural") or "Agricultural",
            "is_encrypted": bool(getattr(doc, "is_encrypted", True)),
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None
        }

    @staticmethod
    def officer_edit_field(
        db: Session,
        document_id: str,
        field_name: str,
        new_value: str,
        unit: Optional[str],
        officer: User,
        reason: Optional[str] = "Officer manual adjustment"
    ) -> Dict[str, Any]:
        """
        Officer directly adds/updates difference in extracted data.
        Records an OFFICER_EDIT action in the cryptographically chained SHA-256 audit ledger.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        field_rec = db.query(ExtractedField).filter(
            ExtractedField.document_id == document_id,
            ExtractedField.field_name == field_name
        ).first()

        old_val = field_rec.value if field_rec else ""
        if not field_rec:
            field_rec = ExtractedField(
                document_id=document_id,
                field_name=field_name,
                ai_value=None,
                ai_confidence=0.0
            )
            db.add(field_rec)

        field_rec.value = new_value
        field_rec.confidence = 100.0
        field_rec.source = "officer_edit"
        if unit:
            field_rec.unit = unit
        field_rec.corrected_by = officer.id
        field_rec.corrected_at = datetime.datetime.utcnow()

        all_fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
        confs = [f.confidence for f in all_fields]
        doc.overall_confidence = round(sum(confs) / len(confs), 1) if confs else 100.0
        doc.updated_at = datetime.datetime.utcnow()

        # Re-run validation engine
        fields_map = {f.field_name: {"value": f.value, "confidence": f.confidence, "source": f.source, "unit": f.unit} for f in all_fields}
        db.query(ValidationResult).filter(ValidationResult.document_id == document_id).delete()
        val_summary = ValidationEngine.validate_document(db, document_id, fields_map)
        for r in val_summary["results"]:
            v_res = ValidationResult(
                document_id=doc.id,
                rule_name=r["rule_name"],
                severity=r["severity"],
                message=r["message"],
                field_name=r.get("field_name"),
                is_blocking=r.get("is_blocking", False),
                details=r.get("details")
            )
            db.add(v_res)

        # Log OFFICER_EDIT to cryptographic audit ledger
        AuditService.record_audit_log(
            db=db,
            user_id=officer.id,
            user_email=officer.email,
            role=officer.role,
            action="OFFICER_EDIT",
            document_id=document_id,
            batch_id=doc.batch_id,
            field_name=field_name,
            old_value=old_val,
            new_value=new_value,
            metadata_json=json.dumps({"reason": reason, "officer_name": officer.full_name})
        )
        db.commit()

        return DocumentService.get_canonical_document(db, document_id)

    @staticmethod
    def correct_field(
        db: Session,
        document_id: str,
        field_name: str,
        new_value: str,
        unit: Optional[str],
        user: User
    ) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        field_rec = db.query(ExtractedField).filter(
            ExtractedField.document_id == document_id,
            ExtractedField.field_name == field_name
        ).first()

        old_val = field_rec.value if field_rec else ""
        
        if not field_rec:
            field_rec = ExtractedField(
                document_id=document_id,
                field_name=field_name,
                ai_value=None,
                ai_confidence=0.0
            )
            db.add(field_rec)

        # Update field attributes
        field_rec.value = new_value
        field_rec.confidence = 100.0 # Human verified becomes 100%
        field_rec.source = "corrected"
        if unit:
            field_rec.unit = unit
        field_rec.corrected_by = user.id
        field_rec.corrected_at = datetime.datetime.utcnow()

        # Recompute overall confidence
        all_fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
        confs = [f.confidence for f in all_fields]
        doc.overall_confidence = round(sum(confs) / len(confs), 1) if confs else 100.0
        doc.updated_at = datetime.datetime.utcnow()

        # Re-run validation engine
        fields_map = {f.field_name: {"value": f.value, "confidence": f.confidence, "source": f.source, "unit": f.unit} for f in all_fields}
        db.query(ValidationResult).filter(ValidationResult.document_id == document_id).delete()
        val_summary = ValidationEngine.validate_document(db, document_id, fields_map)
        for r in val_summary["results"]:
            v_res = ValidationResult(
                document_id=doc.id,
                rule_name=r["rule_name"],
                severity=r["severity"],
                message=r["message"],
                field_name=r.get("field_name"),
                is_blocking=r.get("is_blocking", False),
                details=r.get("details")
            )
            db.add(v_res)

        # Create immutable, cryptographically hash-chained AuditLog
        AuditService.record_audit_log(
            db=db,
            user_id=user.id,
            user_email=user.email,
            role=user.role,
            action="FIELD_CORRECTED",
            document_id=document_id,
            batch_id=doc.batch_id,
            field_name=field_name,
            old_value=old_val,
            new_value=new_value,
            metadata_json=json.dumps({"corrected_by_name": user.full_name, "unit": unit})
        )
        db.commit()

        # Send feedback to ML service for active learning
        ml_client.send_feedback(
            document_id=document_id,
            field_name=field_name,
            original_value=old_val or "",
            corrected_value=new_value,
            user_id=user.email
        )

        return DocumentService.get_canonical_document(db, document_id)

    @staticmethod
    def submit_for_approval(db: Session, document_id: str, user: User) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        all_fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
        fields_map = {f.field_name: {"value": f.value, "confidence": f.confidence, "source": f.source, "unit": f.unit} for f in all_fields}

        # Rule Check: If any field has confidence < 60% with source == 'auto', submission is strictly blocked!
        for f in all_fields:
            if f.confidence < 60.0 and f.source == "auto":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Cannot submit: Field '{f.field_name}' has low confidence ({f.confidence}%) and must be manually verified or corrected by an operator."
                )

        # Check for blocking validation errors
        val_summary = ValidationEngine.validate_document(db, document_id, fields_map)
        if val_summary["error_count"] > 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Cannot submit: Document has {val_summary['error_count']} blocking validation errors that must be resolved."
            )

        doc.status = "reviewed"
        doc.reviewed_by = user.id
        doc.reviewed_at = datetime.datetime.utcnow()
        doc.updated_at = datetime.datetime.utcnow()

        AuditService.record_audit_log(
            db=db,
            user_id=user.id,
            user_email=user.email,
            role=user.role,
            action="SUBMITTED",
            document_id=document_id,
            batch_id=doc.batch_id,
            new_value="Submitted for Officer Approval"
        )
        db.commit()

        # Emit n8n automation event
        webhook_service.emit_event(
            event_type="DOCUMENT_SUBMITTED",
            document_id=document_id,
            batch_id=doc.batch_id,
            actor_email=user.email,
            actor_role=user.role,
            status=doc.status,
            payload_data={
                "filename": doc.filename,
                "overall_confidence": doc.overall_confidence,
                "fields": fields_map
            }
        )

        return DocumentService.get_canonical_document(db, document_id)

    @staticmethod
    def approve_document(db: Session, document_id: str, officer: User) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        all_fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
        fields_map = {f.field_name: {"value": f.value, "confidence": f.confidence, "source": f.source, "unit": f.unit} for f in all_fields}

        # 1. Final validation check
        val_summary = ValidationEngine.validate_document(db, document_id, fields_map)
        if val_summary["error_count"] > 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Cannot approve: Document has {val_summary['error_count']} blocking validation errors."
            )

        # 2. Build Canonical Payload for LRMS Adapter
        payload = {
            "document_id": doc.id,
            "batch_id": doc.batch_id,
            "fields": fields_map,
            "overall_confidence": doc.overall_confidence,
            "status": "approved",
            "original_scan_url": doc.original_scan_url,
            "officer_id": officer.email,
            "approval_timestamp": datetime.datetime.utcnow().isoformat()
        }

        # 3. Call LRMS Adapter
        lrms_response = lrms_adapter.push_record(payload)

        if lrms_response.get("status") == "rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"LRMS Gateway Rejected Record: {lrms_response.get('reason')}"
            )

        external_id = lrms_response.get("external_id") or "LRMS-2026-000101"
        cadastral_code = lrms_response.get("cadastral_registry_code")

        # 4. Save LRMS Push Log
        push_log = LRMSPushLog(
            document_id=doc.id,
            external_id=external_id,
            cadastral_registry_code=cadastral_code,
            status="accepted",
            pushed_payload=json.dumps(payload),
            response_payload=json.dumps(lrms_response),
            pushed_by=officer.id
        )
        db.add(push_log)

        # 5. Update Document Status
        doc.status = "pushed_to_lrms"
        doc.approved_by = officer.id
        doc.approved_at = datetime.datetime.utcnow()
        doc.external_lrms_id = external_id
        doc.updated_at = datetime.datetime.utcnow()

        # 6. Create Cryptographically Chained Audit Logs
        AuditService.record_audit_log(
            db=db,
            user_id=officer.id,
            user_email=officer.email,
            role=officer.role,
            action="APPROVED",
            document_id=document_id,
            batch_id=doc.batch_id,
            new_value=f"Approved by Officer {officer.full_name}"
        )
        AuditService.record_audit_log(
            db=db,
            user_id=officer.id,
            user_email=officer.email,
            role=officer.role,
            action="PUSHED_TO_LRMS",
            document_id=document_id,
            batch_id=doc.batch_id,
            new_value=f"Pushed to State LRMS with External ID: {external_id}"
        )
        db.commit()

        from app.services.supabase_service import supabase_service
        try:
            supabase_service.mirror_upsert("documents", {
                "id": doc.id,
                "batch_id": doc.batch_id,
                "status": doc.status,
                "approved_by": officer.id,
                "approved_at": doc.approved_at.isoformat() if doc.approved_at else None,
                "external_lrms_id": external_id
            })
            supabase_service.mirror_upsert("lrms_push_log", {
                "id": push_log.id,
                "document_id": push_log.document_id,
                "external_id": push_log.external_id,
                "cadastral_registry_code": push_log.cadastral_registry_code,
                "status": push_log.status,
                "pushed_payload": push_log.pushed_payload,
                "response_payload": push_log.response_payload,
                "pushed_by": push_log.pushed_by,
                "pushed_at": push_log.pushed_at.isoformat() if push_log.pushed_at else None
            })
        except Exception:
            pass

        # Emit n8n automation event on approval and external sync
        webhook_service.emit_event(
            event_type="DOCUMENT_APPROVED",
            document_id=document_id,
            batch_id=doc.batch_id,
            actor_email=officer.email,
            actor_role=officer.role,
            status=doc.status,
            payload_data={
                "filename": doc.filename,
                "external_lrms_id": external_id,
                "cadastral_code": cadastral_code,
                "fields": fields_map,
                "lrms_response": lrms_response
            }
        )

        canonical_doc = DocumentService.get_canonical_document(db, document_id)
        canonical_doc["lrms_sync"] = lrms_response
        return canonical_doc

    @staticmethod
    def reject_document(db: Session, document_id: str, reason: str, officer: User) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        doc.status = "rejected"
        doc.rejection_reason = reason
        doc.updated_at = datetime.datetime.utcnow()

        # Notify operator
        creator_batch = db.query(Batch).filter(Batch.id == doc.batch_id).first()
        if creator_batch and creator_batch.created_by:
            notif = Notification(
                user_id=creator_batch.created_by,
                document_id=doc.id,
                title="Document Rejected by Officer",
                message=f"Document {doc.filename} was rejected by Officer {officer.full_name}. Reason: '{reason}'",
                type="warning"
            )
            db.add(notif)

        AuditService.record_audit_log(
            db=db,
            user_id=officer.id,
            user_email=officer.email,
            role=officer.role,
            action="REJECTED",
            document_id=document_id,
            batch_id=doc.batch_id,
            new_value=f"Rejected: {reason}"
        )
        db.commit()

        # Emit n8n automation event on rejection
        webhook_service.emit_event(
            event_type="DOCUMENT_REJECTED",
            document_id=document_id,
            batch_id=doc.batch_id,
            actor_email=officer.email,
            actor_role=officer.role,
            status=doc.status,
            payload_data={
                "filename": doc.filename,
                "rejection_reason": reason,
                "operator_id": creator_batch.created_by if creator_batch else None
            }
        )

        return DocumentService.get_canonical_document(db, document_id)
