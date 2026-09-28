import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, Index
from app.database import Base

class MasterReference(Base):
    __tablename__ = "master_reference"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    tehsil = Column(String(100), nullable=False, index=True)
    village = Column(String(100), nullable=False, index=True)
    census_code = Column(String(50), nullable=True)
    # GeoJSON text storage for cross-engine compatibility (SQLite fallback & API serialization)
    boundary_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_master_geo", "state", "district", "tehsil", "village"),
    )

