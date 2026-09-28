import json
import logging
import threading
import datetime
from typing import Dict, Any, Optional
import requests

from app.config import settings

logger = logging.getLogger("veribhoomi.webhook")


class WebhookService:
    """
    Non-blocking, resilient webhook dispatcher for outbound automations (e.g. n8n).
    Runs HTTP dispatches in separate daemon threads so that core API requests,
    officer approvals, and operator workflows never block or fail due to downstream webhook delays.
    """

    @staticmethod
    def _post_payload(url: str, payload: Dict[str, Any], timeout: float = 3.0):
        try:
            headers = {"Content-Type": "application/json", "User-Agent": "VeriBhoomi-AI-Backend/1.0"}
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            logger.info(f"Webhook dispatched to {url}, status: {response.status_code}")
        except Exception as e:
            logger.warning(f"Failed to dispatch webhook to {url}: {str(e)}")

    @classmethod
    def emit_event(
        cls,
        event_type: str,
        document_id: Optional[str] = None,
        batch_id: Optional[str] = None,
        actor_email: Optional[str] = None,
        actor_role: Optional[str] = None,
        status: Optional[str] = None,
        payload_data: Optional[Dict[str, Any]] = None,
    ):
        """
        Emits a structured event payload to the configured n8n webhook URL.
        """
        if not settings.ENABLE_N8N_WEBHOOKS or not settings.N8N_WEBHOOK_URL:
            return

        event_payload = {
            "event": event_type,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "document_id": document_id,
            "batch_id": batch_id,
            "actor": {
                "email": actor_email,
                "role": actor_role
            },
            "document_status": status,
            "data": payload_data or {}
        }

        thread = threading.Thread(
            target=cls._post_payload,
            args=(settings.N8N_WEBHOOK_URL, event_payload),
            daemon=True
        )
        thread.start()


webhook_service = WebhookService()
