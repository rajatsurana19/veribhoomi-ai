import uuid
import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="State LRMS / DILRMP Gateway (Mock)",
    description="Mock State Land Records Modernization Programme (DILRMP) & Land Records Management System (LRMS) Integration Gateway",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for pushed records
pushed_records: Dict[str, Dict[str, Any]] = {}
record_counter = 100

class FieldItem(BaseModel):
    value: Optional[str] = None
    unit: Optional[str] = None
    confidence: Optional[float] = None
    source: Optional[str] = None

class LandRecordPayload(BaseModel):
    document_id: str
    batch_id: Optional[str] = None
    fields: Dict[str, FieldItem]
    overall_confidence: Optional[float] = None
    status: str
    original_scan_url: Optional[str] = None
    officer_id: Optional[str] = None
    approval_timestamp: Optional[str] = None

class LRMSPushResponse(BaseModel):
    status: str
    external_id: str
    message: str
    synced_at: str
    cadastral_registry_code: str
    record: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Mock LRMS / DILRMP Gateway", "records_count": len(pushed_records)}

@app.post("/mock-lrms/records", response_model=LRMSPushResponse, status_code=status.HTTP_201_CREATED)
def push_land_record(payload: LandRecordPayload):
    global record_counter
    
    # 1. Validation check according to DILRMP standard
    fields = payload.fields
    
    # Required core attributes
    owner = fields.get("owner_name")
    khasra = fields.get("khasra_number")
    village = fields.get("village")
    district = fields.get("district")
    
    if not owner or not owner.value or not owner.value.strip():
        raise HTTPException(
            status_code=400,
            detail={"status": "rejected", "reason": "Missing mandatory field: Owner Name (भूस्वामी नाम)"}
        )
        
    if not khasra or not khasra.value or not khasra.value.strip():
        raise HTTPException(
            status_code=400,
            detail={"status": "rejected", "reason": "Missing mandatory field: Khasra Number (खसरा संख्या)"}
        )
        
    if not district or not district.value or not district.value.strip():
        raise HTTPException(
            status_code=400,
            detail={"status": "rejected", "reason": "Missing mandatory field: District (ज़िला)"}
        )

    record_counter += 1
    external_id = f"LRMS-2026-{record_counter:06d}"
    synced_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cadastral_code = f"CAD-{district.value[:3].upper()}-{village.value[:3].upper() if village and village.value else 'GEN'}-{khasra.value}"

    record_data = {
        "external_id": external_id,
        "document_id": payload.document_id,
        "batch_id": payload.batch_id,
        "cadastral_code": cadastral_code,
        "synced_at": synced_at,
        "fields": {k: v.model_dump() for k, v in fields.items()},
        "officer_id": payload.officer_id,
        "state_registry_status": "COMMITTED_TO_CADASTRAL_DB"
    }

    pushed_records[external_id] = record_data

    return LRMSPushResponse(
        status="accepted",
        external_id=external_id,
        message="Record successfully validated and committed to State LRMS Cadastral Ledger",
        synced_at=synced_at,
        cadastral_registry_code=cadastral_code,
        record=record_data
    )

@app.get("/mock-lrms/records/{external_id}")
def get_pushed_record(external_id: str):
    if external_id not in pushed_records:
        raise HTTPException(status_code=404, detail=f"Record {external_id} not found in LRMS registry")
    return pushed_records[external_id]

@app.get("/mock-lrms/records")
def list_pushed_records():
    return {
        "total": len(pushed_records),
        "records": list(pushed_records.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
