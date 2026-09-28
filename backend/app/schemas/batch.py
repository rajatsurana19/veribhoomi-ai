import datetime
from typing import Optional, List
from pydantic import BaseModel

class BatchCreate(BaseModel):
    name: str
    state: str = "Uttar Pradesh"
    district: str = "Varanasi"
    tehsil: str = "Sadar"
    village: str = "Rampur"

class BatchOut(BaseModel):
    id: str
    name: str
    state: str
    district: str
    tehsil: str
    village: str
    status: str
    total_documents: int
    created_by: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class BatchWithStats(BatchOut):
    processed_count: int = 0
    needs_review_count: int = 0
    approved_count: int = 0
    avg_confidence: float = 0.0
