import uuid
import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # operator, officer, admin, system
    
    # Actions: FIELD_CORRECTED, SUBMITTED, APPROVED, REJECTED, ESCALATED, PUSHED_TO_LRMS, BATCH_CREATED
    action = Column(String(50), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True, index=True)
    batch_id = Column(String(36), nullable=True)
    
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    
    metadata_json = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    # Cryptographic Hash-Chained Ledger Properties
    entry_hash = Column(String(64), nullable=False, index=True)
    previous_hash = Column(String(64), nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    document = relationship("Document", back_populates="audit_logs")
