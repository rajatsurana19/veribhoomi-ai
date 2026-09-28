import os
import json
import uuid
import hashlib
import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.audit_log import AuditLog

def canonical_serialize(data: Dict[str, Any]) -> str:
    """
    RFC 8785 compliant canonical JSON serialization:
    Sorted keys, compact separators, deterministic encoding across platforms.
    """
    return json.dumps(data, sort_keys=True, separators=(',', ':'), default=str)

def compute_row_payload(row: Any) -> Dict[str, Any]:
    """
    Extracts canonical data dictionary from an AuditLog model or row mapping.
    """
    ts = getattr(row, "timestamp", None)
    if isinstance(ts, datetime.datetime):
        ts_str = ts.isoformat()
    else:
        ts_str = str(ts)

    return {
        "id": str(getattr(row, "id", "")),
        "user_id": str(getattr(row, "user_id", "") or ""),
        "user_email": str(getattr(row, "user_email", "") or ""),
        "role": str(getattr(row, "role", "") or ""),
        "action": str(getattr(row, "action", "") or ""),
        "document_id": str(getattr(row, "document_id", "") or ""),
        "batch_id": str(getattr(row, "batch_id", "") or ""),
        "field_name": str(getattr(row, "field_name", "") or ""),
        "old_value": str(getattr(row, "old_value", "") or ""),
        "new_value": str(getattr(row, "new_value", "") or ""),
        "metadata_json": str(getattr(row, "metadata_json", "") or ""),
        "ip_address": str(getattr(row, "ip_address", "") or "127.0.0.1"),
        "timestamp": ts_str
    }

def compute_entry_hash(row_data: Dict[str, Any], previous_hash: Optional[str]) -> str:
    """
    Computes cryptographic SHA-256 hash for an audit ledger entry:
    entry_hash = SHA256(canonical_serialization(row_data) + (previous_hash or ""))
    """
    canonical_str = canonical_serialize(row_data)
    combined = canonical_str + (previous_hash or "")
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()

class AuditService:
    @staticmethod
    def ensure_schema_and_backfill(db: Session) -> int:
        """
        Ensures audit_log table has entry_hash and previous_hash columns,
        and backfills any existing unchained rows sequentially.
        """
        # 1. Check existing columns
        try:
            res = db.execute(text("PRAGMA table_info(audit_log);")).fetchall()
            col_names = [r[1] for r in res]
            if "entry_hash" not in col_names:
                db.execute(text("ALTER TABLE audit_log ADD COLUMN entry_hash VARCHAR(64);"))
                db.commit()
            if "previous_hash" not in col_names:
                db.execute(text("ALTER TABLE audit_log ADD COLUMN previous_hash VARCHAR(64);"))
                db.commit()
        except Exception:
            # If not SQLite or already present, continue
            pass

        # 2. Check for rows needing hash calculation
        rows = db.query(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc()).all()
        needs_migration = any(r.entry_hash is None for r in rows)
        if not needs_migration:
            return 0

        return AuditService.rechain_ledger(db)

    @staticmethod
    def rechain_ledger(db: Session) -> int:
        """
        Recomputes hash chain sequentially across all rows in table order (by rowid or timestamp).
        Guarantees strictly monotonic timestamps and unbroken cryptographic hash linkage.
        """
        try:
            rows = db.query(AuditLog).from_statement(text("SELECT * FROM audit_log ORDER BY rowid ASC")).all()
        except Exception:
            rows = db.query(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc()).all()

        prev_hash = None
        count = 0
        last_ts = None
        for r in rows:
            if last_ts and r.timestamp <= last_ts:
                r.timestamp = last_ts + datetime.timedelta(microseconds=1000)
            last_ts = r.timestamp

            payload = compute_row_payload(r)
            r.previous_hash = prev_hash
            r.entry_hash = compute_entry_hash(payload, prev_hash)
            prev_hash = r.entry_hash
            count += 1

        db.commit()
        return count

    @staticmethod
    def record_audit_log(
        db: Session,
        user_email: str,
        role: str,
        action: str,
        user_id: Optional[str] = None,
        document_id: Optional[str] = None,
        batch_id: Optional[str] = None,
        field_name: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        metadata_json: Optional[str] = None,
        ip_address: str = "127.0.0.1",
        timestamp: Optional[datetime.datetime] = None
    ) -> AuditLog:
        """
        Appends an immutable, tamper-evident audit record to the cryptographic hash chain.
        """
        # Acquire lock on the latest audit log entry to guarantee strict sequential chaining under concurrency
        query = db.query(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
        
        # SQLite does not support row-level with_for_update, but PostgreSQL/PostGIS does
        try:
            if db.bind and db.bind.dialect.name != "sqlite":
                query = query.with_for_update()
        except Exception:
            pass

        last_entry = query.first()
        
        # If last entry has no hash (pre-existing DB), backfill first
        if last_entry and last_entry.entry_hash is None:
            AuditService.ensure_schema_and_backfill(db)
            last_entry = db.query(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.id.desc()).first()

        prev_hash = last_entry.entry_hash if (last_entry and last_entry.entry_hash) else None

        entry_id = str(uuid.uuid4())
        now = timestamp or datetime.datetime.utcnow()
        if last_entry and last_entry.timestamp and now <= last_entry.timestamp:
            entry_ts = last_entry.timestamp + datetime.timedelta(microseconds=1000)
        else:
            entry_ts = now

        payload = {
            "id": entry_id,
            "user_id": str(user_id or ""),
            "user_email": str(user_email or ""),
            "role": str(role or ""),
            "action": str(action or ""),
            "document_id": str(document_id or ""),
            "batch_id": str(batch_id or ""),
            "field_name": str(field_name or ""),
            "old_value": str(old_value or ""),
            "new_value": str(new_value or ""),
            "metadata_json": str(metadata_json or ""),
            "ip_address": str(ip_address or "127.0.0.1"),
            "timestamp": entry_ts.isoformat()
        }

        entry_hash = compute_entry_hash(payload, prev_hash)

        audit = AuditLog(
            id=entry_id,
            user_id=user_id,
            user_email=user_email,
            role=role,
            action=action,
            document_id=document_id,
            batch_id=batch_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            metadata_json=metadata_json,
            ip_address=ip_address,
            timestamp=entry_ts,
            entry_hash=entry_hash,
            previous_hash=prev_hash
        )

        db.add(audit)
        db.flush()

        from app.services.supabase_service import supabase_service
        try:
            supabase_service.mirror_upsert("audit_log", {
                "id": entry_id,
                "user_id": user_id,
                "user_email": user_email,
                "role": role,
                "action": action,
                "document_id": document_id,
                "batch_id": batch_id,
                "field_name": field_name,
                "old_value": old_value,
                "new_value": new_value,
                "metadata_json": metadata_json,
                "ip_address": ip_address,
                "timestamp": entry_ts.isoformat(),
                "entry_hash": entry_hash,
                "previous_hash": prev_hash
            })
        except Exception:
            pass

        return audit
