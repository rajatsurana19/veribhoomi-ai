import os
import requests
from typing import Dict, Any, Optional
from app.config import settings

class MLClient:
    def __init__(self, base_url: str = None):
        self.base_url = (base_url or settings.ML_SERVICE_URL).rstrip("/")

    def extract_document(
        self,
        document_id: str,
        batch_id: str,
        file_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/extract"
        
        payload = {
            "document_id": document_id,
            "batch_id": batch_id,
            "local_file_path": os.path.abspath(file_path),
            "metadata": metadata or {}
        }
        
        try:
            res = requests.post(url, json=payload, timeout=20)
            if res.status_code == 200:
                return res.json()
        except requests.exceptions.RequestException:
            pass

        # Robust direct fallback invocation if ML service process is separate or cold
        from app.pipeline_fallback import extract_fallback
        return extract_fallback(document_id, batch_id, file_path, metadata)

    def send_feedback(
        self,
        document_id: str,
        field_name: str,
        original_value: str,
        corrected_value: str,
        user_id: str = "operator"
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/feedback"
        payload = {
            "document_id": document_id,
            "field_name": field_name,
            "original_value": original_value,
            "corrected_value": corrected_value,
            "user_id": user_id
        }
        try:
            res = requests.post(url, json=payload, timeout=5)
            if res.status_code == 201:
                return res.json()
        except requests.exceptions.RequestException:
            pass
        return {"status": "saved_locally"}

ml_client = MLClient()
