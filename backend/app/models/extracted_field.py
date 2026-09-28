import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database import Base

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False) # owner_name, survey_number, khasra_number, etc.
    
    # Original AI extraction
    ai_value = Column(Text, nullable=True)
    ai_confidence = Column(Float, default=0.0)
    
    # Current active value (either AI extracted or human operator corrected)
    value = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    
    # Source must be either 'auto' or 'corrected'
    source = Column(String(50), default="auto", nullable=False)
    
    # Unit for plot_area: acre, hectare, bigha
    unit = Column(String(50), nullable=True)
    
    # Operator correction audit trail
    corrected_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    corrected_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="fields")
    corrector = relationship("User")

    __table_args__ = (
        Index("idx_doc_field_name", "document_id", "field_name", unique=True),
    )
