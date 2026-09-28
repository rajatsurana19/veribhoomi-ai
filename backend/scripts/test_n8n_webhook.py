"""
VeriBhoomi AI — n8n Webhook Pipeline Verification Script
Spins up a lightweight mock webhook listener and verifies that VeriBhoomi's
webhook dispatcher formats and transmits event payloads cleanly and asynchronously.
"""

import sys
import os
import time
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.services.webhook_service import webhook_service

received_events = []

class MockN8nHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            payload = json.loads(body)
            received_events.append(payload)
            print(f"  [n8n Mock Listener] Received event: {payload.get('event')} | Doc: {payload.get('document_id')}")
        except Exception as e:
            print(f"  [n8n Mock Listener] Error parsing payload: {e}")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"received"}')

    def log_message(self, format, *args):
        # Suppress standard HTTP logging
        return

def run_test():
    print("=" * 70)
    print(" VeriBhoomi AI — n8n Webhook & Event Dispatcher Verification")
    print("=" * 70)

    # 1. Start mock server on port 5679
    test_port = 5679
    server = HTTPServer(("127.0.0.1", test_port), MockN8nHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print(f"[*] Mock n8n Webhook listener running at http://127.0.0.1:{test_port}/webhook/veribhoomi-events")

    # 2. Configure webhook service for testing
    orig_enabled = settings.ENABLE_N8N_WEBHOOKS
    orig_url = settings.N8N_WEBHOOK_URL
    settings.ENABLE_N8N_WEBHOOKS = True
    settings.N8N_WEBHOOK_URL = f"http://127.0.0.1:{test_port}/webhook/veribhoomi-events"

    try:
        # Test Event 1: DOCUMENT_APPROVED
        print("\n[+] Emitting event: DOCUMENT_APPROVED...")
        webhook_service.emit_event(
            event_type="DOCUMENT_APPROVED",
            document_id="doc-test-42",
            batch_id="batch-andheri-1",
            actor_email="officer@veribhoomi.gov",
            actor_role="officer",
            status="pushed_to_lrms",
            payload_data={
                "filename": "andheri_712_gat42.pdf",
                "external_lrms_id": "MAHA-MUM-AND-2026-0042",
                "cadastral_code": "27-418-0012-00042",
                "fields": {
                    "survey_number": {"value": "42/B"},
                    "village": {"value": "Andheri"},
                    "taluka": {"value": "Andheri"},
                    "district": {"value": "Mumbai Suburban"},
                    "khatedar_names": {"value": "रामचंद्र विठ्ठल कदम (Ramchandra Vithal Kadam)"},
                    "total_area": {"value": "0.8500", "unit": "Ha"}
                }
            }
        )

        # Test Event 2: DOCUMENT_REJECTED
        print("[+] Emitting event: DOCUMENT_REJECTED...")
        webhook_service.emit_event(
            event_type="DOCUMENT_REJECTED",
            document_id="doc-test-99",
            batch_id="batch-andheri-1",
            actor_email="officer@veribhoomi.gov",
            actor_role="officer",
            status="rejected",
            payload_data={
                "filename": "kurla_scan_corrupt.pdf",
                "rejection_reason": "Pot-Kharaba land area calculation does not match Form 7 total."
            }
        )

        # Test Event 3: NOTIFICATION_DISPATCHED
        print("[+] Emitting event: NOTIFICATION_DISPATCHED (Directive / Redo)...")
        webhook_service.emit_event(
            event_type="NOTIFICATION_DISPATCHED",
            document_id="doc-test-42",
            actor_email="admin@veribhoomi.gov",
            actor_role="admin",
            status="redo_request",
            payload_data={
                "title": "Priority Redo Notice: Re-align Survey Boundary",
                "message": "Please cross-verify Khatedar joint ownership against Mutation register.",
                "type": "redo_request",
                "recipient_role": "operator"
            }
        )

        # Test Event 4: OPERATOR_REVERTED
        print("[+] Emitting event: OPERATOR_REVERTED (Resolution Reply)...")
        webhook_service.emit_event(
            event_type="OPERATOR_REVERTED",
            document_id="doc-test-42",
            actor_email="operator@veribhoomi.gov",
            actor_role="operator",
            status="reviewed",
            payload_data={
                "original_title": "Priority Redo Notice: Re-align Survey Boundary",
                "reply_message": "Mutation 1892 verified; Khatedar entries corrected and re-submitted.",
                "recipient_id": "officer-user-id"
            }
        )

        # Allow daemon threads to deliver payloads
        time.sleep(1.0)

        print(f"\n[OK] Results: Received {len(received_events)} / 4 events in mock n8n listener.")
        for i, ev in enumerate(received_events, 1):
            print(f"    {i}. {ev['event']} (Timestamp: {ev['timestamp']}) - Actor: {ev['actor']['email']}")

        assert len(received_events) == 4, f"Expected 4 events, got {len(received_events)}"
        print("\n[SUCCESS] All VeriBhoomi n8n webhook dispatches executed and verified successfully!")

    finally:
        settings.ENABLE_N8N_WEBHOOKS = orig_enabled
        settings.N8N_WEBHOOK_URL = orig_url
        server.shutdown()

if __name__ == "__main__":
    run_test()
