import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    OPERATOR = "operator"
    OFFICER = "officer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.OPERATOR.value, nullable=False)
    department = Column(String(255), default="Revenue Department")
    designation = Column(String(255), default="Staff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    batches = relationship("Batch", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")
