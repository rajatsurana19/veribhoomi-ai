import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    batch_id = Column(String(36), nullable=True)
    document_id = Column(String(36), nullable=True)
    sender_id = Column(String(36), nullable=True)
    sender_role = Column(String(50), nullable=True) # admin, officer, operator
    parent_notification_id = Column(String(36), nullable=True)
    action_type = Column(String(50), default="redo_request") # redo_request, revert_reply, info, warning
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info") # info, warning, success, error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    recipient = relationship("User", foreign_keys=[user_id])
