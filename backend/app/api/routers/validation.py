from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.validation_result import ValidationResult
from app.schemas.validation import DocumentValidationSummary
from app.validation.engine import ValidationEngine
from app.dependencies import get_current_user

router = APIRouter(prefix="/documents", tags=["Validation"])

@router.get("/{document_id}/validation", response_model=DocumentValidationSummary, summary="Get Document Validation Results")
def get_document_validation(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
    fields_dict = {f.field_name: {"value": f.value, "confidence": f.confidence, "source": f.source, "unit": f.unit} for f in fields}

    summary = ValidationEngine.validate_document(db, document_id, fields_dict)
    
    # Fetch database stored results
    db_results = db.query(ValidationResult).filter(ValidationResult.document_id == document_id).all()
    
    return {
        "document_id": document_id,
        "total_checks": summary["total_checks"],
        "passed_count": summary["passed_count"],
        "warning_count": summary["warning_count"],
        "error_count": summary["error_count"],
        "can_submit": summary["can_submit"],
        "can_approve": summary["can_approve"],
        "results": db_results if db_results else summary["results"]
    }
