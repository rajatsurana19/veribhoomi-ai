import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Index, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Float, default=0)
    mime_type = Column(String(100), default="image/png")
    
    # Original scanned document must remain immutable
    original_scan_url = Column(String(500), nullable=False)
    storage_path = Column(String(500), nullable=False)
    
    # Status: queued, processing, ocr_complete, needs_review, reviewed, approved, rejected, pushed_to_lrms
    status = Column(String(50), default="queued", index=True)
    
    overall_confidence = Column(Float, default=0.0)

    # Classification & Duplication
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(String(36), nullable=True)
    land_type = Column(String(50), default="Agricultural") # Agricultural or Non-Agricultural
    is_encrypted = Column(Boolean, default=True)
    
    # Review & Approval workflow attributes
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    rejection_reason = Column(Text, nullable=True)
    escalation_notes = Column(Text, nullable=True)

    # LRMS integration reference
    external_lrms_id = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    batch = relationship("Batch", back_populates="documents")
    fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="document", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document")
    lrms_logs = relationship("LRMSPushLog", back_populates="document")

    __table_args__ = (
        Index("idx_doc_batch_status", "batch_id", "status"),
    )
