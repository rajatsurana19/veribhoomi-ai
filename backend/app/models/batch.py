import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False, default="Uttar Pradesh")
    district = Column(String(100), nullable=False, default="Varanasi")
    tehsil = Column(String(100), nullable=False, default="Sadar")
    village = Column(String(100), nullable=False, default="Rampur")
    status = Column(String(50), default="active") # active, completed, archived
    total_documents = Column(Integer, default=0)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="batches")
    documents = relationship("Document", back_populates="batch", cascade="all, delete-orphan")
