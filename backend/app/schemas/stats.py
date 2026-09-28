from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SummaryStats(BaseModel):
    total_documents: int
    processed_documents: int
    needs_review: int
    reviewed: int
    approved: int
    rejected: int
    pushed_to_lrms: int
    avg_confidence: float
    validation_error_rate: float
    total_batches: int

class TimeseriesDataPoint(BaseModel):
    date: str
    uploaded: int
    processed: int
    approved: int
    pushed: int

class ConfidenceBucket(BaseModel):
    range: str # e.g. "90-100%", "75-89%", "60-74%", "<60%"
    count: int
    percentage: float

class RegionalProgress(BaseModel):
    state: str
    district: str
    village: str
    processed: int
    pending: int
    approved: int
    pushed_to_lrms: int
    avg_confidence: float
    total_plots: int
