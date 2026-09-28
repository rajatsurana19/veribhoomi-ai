import datetime
from typing import Optional, List
from pydantic import BaseModel

class ValidationRuleResult(BaseModel):
    id: str
    rule_name: str
    severity: str # INFO, WARNING, ERROR
    message: str
    field_name: Optional[str] = None
    is_blocking: bool = False
    is_resolved: bool = False
    details: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentValidationSummary(BaseModel):
    document_id: str
    total_checks: int
    passed_count: int
    warning_count: int
    error_count: int
    can_submit: bool
    can_approve: bool
    results: List[ValidationRuleResult]
