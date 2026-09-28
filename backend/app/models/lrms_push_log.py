import uuid
import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class LRMSPushLog(Base):
    __tablename__ = "lrms_push_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    external_id = Column(String(100), nullable=False, index=True) # e.g. LRMS-2026-000123
    cadastral_registry_code = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False) # accepted, rejected
    pushed_payload = Column(Text, nullable=False)
    response_payload = Column(Text, nullable=True)
    pushed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    pushed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="lrms_logs")
    officer = relationship("User")
