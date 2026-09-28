"""
VeriBhoomi AI — Master Database Synchronizer to Supabase Cloud
Syncs all existing local batches, documents, extracted fields, validation results,
notifications, and audit logs into the live Supabase cloud database (ncvowwkrzsiexvcrhpyi.supabase.co).
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.config import settings
from app.models.batch import Batch
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.validation_result import ValidationResult
from app.models.notification import Notification
from app.models.audit_log import AuditLog

SUPABASE_URL = settings.SUPABASE_URL.rstrip('/')
HEADERS = {
    "apikey": settings.SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def clean_record(d):
    out = {}
    for k, v in d.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, (str, int, float, bool)) or v is None:
            out[k] = v
        elif isinstance(v, (dict, list)):
            out[k] = v
    return out

def post_batch(table, records, chunk_size=50):
    if not records:
        return 0
    success_count = 0
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        clean_chunk = [clean_record(r) for r in chunk]
        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers=HEADERS,
                json=clean_chunk,
                timeout=10
            )
            if resp.status_code in (200, 201):
                success_count += len(chunk)
            else:
                # Try single upserts if chunk failed on constraint
                for single in clean_chunk:
                    r2 = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=[single], timeout=5)
                    if r2.status_code in (200, 201):
                        success_count += 1
                    else:
                        print(f"  [Notice] {table} single error ({r2.status_code}): {r2.text[:100]}")
        except Exception as e:
            print(f"  [Error] {table} chunk {i}: {e}")
    return success_count

def run_sync():
    print("=" * 70)
    print(" VeriBhoomi AI -> Supabase Cloud Database Synchronizer")
    print(f" Target: {SUPABASE_URL}")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. Sync Batches
        batches = db.query(Batch).all()
        batch_recs = [{
            "id": b.id,
            "name": b.name,
            "state": b.state,
            "district": b.district,
            "tehsil": b.tehsil,
            "village": b.village,
            "status": b.status,
            "total_documents": len(b.documents) if hasattr(b, 'documents') else 0,
            "created_by": b.created_by,
            "created_at": b.created_at,
            "updated_at": b.updated_at
        } for b in batches]
        synced_b = post_batch("batches", batch_recs)
        print(f"[+] Batches: {synced_b} / {len(batch_recs)} synced to Supabase")

        # 2. Sync Documents
        docs = db.query(Document).all()
        doc_recs = [{
            "id": d.id,
            "batch_id": d.batch_id,
            "filename": d.filename,
            "file_size_bytes": getattr(d, "file_size_bytes", 0),
            "mime_type": getattr(d, "mime_type", "image/png"),
            "original_scan_url": d.original_scan_url,
            "storage_path": d.storage_path,
            "status": d.status,
            "overall_confidence": d.overall_confidence,
            "reviewed_by": d.reviewed_by,
            "reviewed_at": d.reviewed_at,
            "approved_by": d.approved_by,
            "approved_at": d.approved_at,
            "rejection_reason": d.rejection_reason,
            "escalation_notes": d.escalation_notes,
            "external_lrms_id": d.external_lrms_id,
            "created_at": d.created_at,
            "updated_at": d.updated_at
        } for d in docs]
        synced_d = post_batch("documents", doc_recs)
        print(f"[+] Documents: {synced_d} / {len(doc_recs)} synced to Supabase")

        # 3. Sync Extracted Fields
        fields = db.query(ExtractedField).all()
        field_recs = [{
            "id": f.id,
            "document_id": f.document_id,
            "field_name": f.field_name,
            "ai_value": f.ai_value,
            "ai_confidence": f.ai_confidence,
            "value": f.value,
            "confidence": f.confidence,
            "source": f.source,
            "unit": f.unit,
            "corrected_by": f.corrected_by,
            "corrected_at": f.corrected_at,
            "created_at": f.created_at,
            "updated_at": f.updated_at
        } for f in fields]
        synced_f = post_batch("extracted_fields", field_recs)
        print(f"[+] Extracted Fields: {synced_f} / {len(field_recs)} synced to Supabase")

        # 4. Sync Validation Results
        vals = db.query(ValidationResult).all()
        val_recs = [{
            "id": v.id,
            "document_id": v.document_id,
            "rule_name": v.rule_name,
            "severity": v.severity,
            "message": v.message,
            "field_name": getattr(v, "field_name", None),
            "is_blocking": getattr(v, "is_blocking", False),
            "is_resolved": getattr(v, "is_resolved", False),
            "details": getattr(v, "details", None),
            "created_at": v.created_at
        } for v in vals]
        synced_v = post_batch("validation_results", val_recs)
        print(f"[+] Validation Results: {synced_v} / {len(val_recs)} synced to Supabase")

        # 5. Sync Notifications
        notifs = db.query(Notification).all()
        notif_recs = [{
            "id": n.id,
            "user_id": n.user_id,
            "document_id": n.document_id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        } for n in notifs]
        synced_n = post_batch("notifications", notif_recs)
        print(f"[+] Notifications: {synced_n} / {len(notif_recs)} synced to Supabase")

        # 6. Sync Audit Logs
        audits = db.query(AuditLog).all()
        audit_recs = [{
            "id": a.id,
            "user_id": a.user_id,
            "user_email": a.user_email,
            "role": a.role,
            "action": a.action,
            "document_id": a.document_id,
            "batch_id": a.batch_id,
            "field_name": getattr(a, "field_name", None),
            "old_value": a.old_value,
            "new_value": a.new_value,
            "metadata_json": getattr(a, "metadata_json", None),
            "ip_address": getattr(a, "ip_address", None),
            "timestamp": a.timestamp,
            "entry_hash": getattr(a, "entry_hash", getattr(a, "current_hash", None)),
            "previous_hash": a.previous_hash
        } for a in audits]
        synced_a = post_batch("audit_log", audit_recs)
        print(f"[+] Audit Logs: {synced_a} / {len(audit_recs)} synced to Supabase")

        print("\n[SUCCESS] Full Database Synchronization to Supabase Completed!")

    finally:
        db.close()

if __name__ == "__main__":
    run_sync()
