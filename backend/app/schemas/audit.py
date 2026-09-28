import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: str
    role: str
    action: str
    document_id: Optional[str] = None
    batch_id: Optional[str] = None
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime.datetime
    entry_hash: Optional[str] = None
    previous_hash: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogFilter(BaseModel):
    user_id: Optional[str] = None
    document_id: Optional[str] = None
    action: Optional[str] = None
    limit: int = 50
    offset: int = 0
