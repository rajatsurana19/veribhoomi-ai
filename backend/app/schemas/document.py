import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class FieldValue(BaseModel):
    value: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=100.0)
    source: str = Field(default="auto") # auto | corrected
    unit: Optional[str] = None # acre | hectare | bigha

class CanonicalFields(BaseModel):
    owner_name: FieldValue
    survey_number: FieldValue
    khasra_number: FieldValue
    khata_number: FieldValue
    plot_area: FieldValue
    village: FieldValue
    tehsil: FieldValue
    district: FieldValue
    land_classification: FieldValue
    mutation_details: FieldValue
    registration_info: FieldValue

class CanonicalDocument(BaseModel):
    document_id: str
    batch_id: str
    filename: Optional[str] = None
    fields: CanonicalFields
    overall_confidence: float = Field(ge=0.0, le=100.0)
    status: str # processing | needs_review | reviewed | approved | rejected | pushed_to_lrms
    original_scan_url: str
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    land_type: Optional[str] = "Agricultural"
    is_encrypted: bool = True
    external_lrms_id: Optional[str] = None

class FieldCorrectionRequest(BaseModel):
    field_name: str
    value: str
    unit: Optional[str] = None

class BatchFieldCorrectionRequest(BaseModel):
    corrections: List[FieldCorrectionRequest]

class OfficerEditRequest(BaseModel):
    field_name: str
    value: Optional[str] = None
    new_value: Optional[str] = None
    unit: Optional[str] = None
    reason: Optional[str] = "Officer discrepancy adjustment"

class DocumentListItem(BaseModel):
    id: str
    batch_id: str
    filename: str
    status: str
    overall_confidence: float
    original_scan_url: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    owner_name: Optional[str] = None
    khasra_number: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    external_lrms_id: Optional[str] = None
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    land_type: Optional[str] = "Agricultural"

    class Config:
        from_attributes = True

class RejectRequest(BaseModel):
    reason: str

class EscalateRequest(BaseModel):
    notes: str

