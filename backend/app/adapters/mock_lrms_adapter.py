import requests
from typing import Dict, Any
from app.config import settings
from app.adapters.base import LRMSAdapter

class MockLRMSAdapter(LRMSAdapter):
    """
    Mock LRMS Integration Adapter communicating with the State DILRMP Mock Service.
    """

    def __init__(self, base_url: str = None):
        self.base_url = (base_url or settings.MOCK_LRMS_URL).rstrip("/")

    def push_record(self, document_payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/mock-lrms/records"
        try:
            response = requests.post(url, json=document_payload, timeout=8)
            if response.status_code == 201:
                return response.json()
            else:
                # Handle mock rejection or validation errors
                err_detail = response.json().get("detail", {}) if response.headers.get("content-type") == "application/json" else response.text
                return {
                    "status": "rejected",
                    "reason": str(err_detail),
                    "external_id": None
                }
        except requests.exceptions.RequestException as e:
            # Fallback for offline/monolithic execution: Generate synthetic external ID
            import uuid, datetime
            record_num = uuid.uuid4().hex[:6].upper()
            ext_id = f"LRMS-2026-{record_num}"
            return {
                "status": "accepted",
                "external_id": ext_id,
                "message": "Committed to Mock State LRMS (Local Fallback)",
                "synced_at": datetime.datetime.utcnow().isoformat(),
                "cadastral_registry_code": f"CAD-VAR-RAM-{document_payload.get('fields', {}).get('khasra_number', {}).get('value', '102')}"
            }

    def get_record(self, external_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/mock-lrms/records/{external_id}"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                return res.json()
        except requests.exceptions.RequestException:
            pass
        return {"status": "not_found", "external_id": external_id}

# Default adapter instance
lrms_adapter = MockLRMSAdapter()
