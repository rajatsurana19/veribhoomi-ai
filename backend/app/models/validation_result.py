import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    rule_name = Column(String(100), nullable=False)
    # Severity: INFO, WARNING, ERROR
    severity = Column(String(20), default="INFO", nullable=False)
    message = Column(Text, nullable=False)
    field_name = Column(String(100), nullable=True)
    is_blocking = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    details = Column(Text, nullable=True) # JSON details if needed
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="validation_results")
