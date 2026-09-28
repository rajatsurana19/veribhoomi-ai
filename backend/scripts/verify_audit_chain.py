#!/usr/bin/env python3
"""
VeriBhoomi AI — Audit Ledger Cryptographic Chain Verifier
Validates sequential SHA-256 hash chaining across all audit records from genesis to head.
Demonstrates tamper-evidence: any unauthorized edit to historical audit rows breaks the chain.
"""
import sys
import os
import argparse
import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.services.audit_service import (
    AuditService,
    compute_row_payload,
    compute_entry_hash,
    canonical_serialize
)

def verify_audit_ledger(db=None, verbose=True):
    """
    Sequentially traverses the audit ledger from genesis to head.
    Returns (is_valid, report_dict)
    """
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        # First ensure schema migration and backfill if necessary
        AuditService.ensure_schema_and_backfill(db)

        # Retrieve all audit rows in strict ascending insertion order
        rows = db.query(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc()).all()
        total_rows = len(rows)

        if total_rows == 0:
            if verbose:
                print("Notice: Audit ledger is currently empty. Chain integrity: VALID (0 entries).")
            return True, {"total": 0, "status": "EMPTY", "violations": []}

        violations = []
        verified_chain = []
        prev_hash = None

        if verbose:
            print("\n" + "="*95)
            print(f"VERIBHOOMI AI — CRYPTOGRAPHIC AUDIT LEDGER CHAIN VERIFICATION ({total_rows} RECORDS)")
            print("="*95)
            print(f"{'INDEX':<6} | {'ACTION':<18} | {'SHORT HASH':<14} | {'PREV HASH':<14} | {'STATUS'}")
            print("-" * 95)

        for idx, row in enumerate(rows):
            # 1. Verify previous_hash linkage
            if idx == 0:
                if row.previous_hash is not None and row.previous_hash != "":
                    violations.append({
                        "index": idx,
                        "id": row.id,
                        "type": "GENESIS_PREV_HASH_NON_NULL",
                        "detail": f"Genesis block must have empty previous_hash, found: {row.previous_hash}"
                    })
            else:
                if row.previous_hash != prev_hash:
                    violations.append({
                        "index": idx,
                        "id": row.id,
                        "type": "BROKEN_HASH_LINK",
                        "detail": f"Row previous_hash {row.previous_hash} does not match predecessor entry_hash {prev_hash}"
                    })

            # 2. Recompute cryptographic hash over canonical payload
            payload = compute_row_payload(row)
            recomputed_hash = compute_entry_hash(payload, row.previous_hash)

            if recomputed_hash != row.entry_hash:
                violations.append({
                    "index": idx,
                    "id": row.id,
                    "type": "TAMPER_DETECTED_HASH_MISMATCH",
                    "detail": f"Stored hash {row.entry_hash} != Recomputed hash {recomputed_hash} (Payload modified)"
                })

            status_str = "[FAIL: TAMPERED]" if any(v["index"] == idx for v in violations) else "[PASS: VALID]"

            if verbose:
                short_entry = (row.entry_hash[:10] + "...") if row.entry_hash else "None"
                short_prev = (row.previous_hash[:10] + "...") if row.previous_hash else "GENESIS"
                print(f"#{idx+1:<5} | {row.action:<18} | {short_entry:<14} | {short_prev:<14} | {status_str}")

            prev_hash = row.entry_hash
            verified_chain.append({
                "index": idx,
                "id": row.id,
                "action": row.action,
                "entry_hash": row.entry_hash,
                "previous_hash": row.previous_hash
            })

        is_valid = len(violations) == 0

        if verbose:
            print("=" * 95)
            if is_valid:
                print(f"[SUCCESS] All {total_rows} audit blocks sequentially verified. Ledger cryptographic integrity: 100% INTACT.\n")
            else:
                print(f"[ALERT] Found {len(violations)} cryptographic violation(s) in audit chain!")
                for v in violations:
                    print(f"   -> Block #{v['index']+1} (ID: {v['id']}): {v['type']} — {v['detail']}")
                print("")

        return is_valid, {
            "total": total_rows,
            "status": "VALID" if is_valid else "CORRUPTED",
            "violations": violations,
            "chain": verified_chain
        }

    finally:
        if owns_session:
            db.close()

def demonstrate_tamper_detection():
    """
    Demonstrates tamper-evidence by altering an existing audit record
    and asserting that sequential chain verification catches it.
    """
    print("\n" + "#"*95)
    print("DEMONSTRATION: CRYPTOGRAPHIC TAMPER EVIDENCE & IMMUTABILITY ENFORCEMENT")
    print("#"*95)

    db = SessionLocal()
    try:
        AuditService.ensure_schema_and_backfill(db)
        rows = db.query(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc()).all()
        if len(rows) < 2:
            print("Need at least 2 audit entries for tamper test. Creating test rows...")
            AuditService.record_audit_log(db, "admin@veribhoomi.demo", "admin", "SYSTEM_INIT", new_value="Genesis block")
            AuditService.record_audit_log(db, "operator@veribhoomi.demo", "operator", "FIELD_CORRECTED", new_value="Khasra changed to 102")
            db.commit()
            rows = db.query(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.id.asc()).all()

        # Step 1: Verify untouched ledger
        print("\n--- STEP 1: Verifying Authenticity of Legitimate Audit Ledger ---")
        valid_before, _ = verify_audit_ledger(db=db, verbose=True)
        assert valid_before, "Original ledger should be completely valid"

        # Step 2: Simulate malicious database tampering
        target_index = 1
        target_row = rows[target_index]
        original_value = target_row.new_value
        malicious_value = "MALICIOUS TAMPER: Unauthorized ownership transfer inserted directly into DB!"
        
        print(f"\n--- STEP 2: Simulating Malicious Tamper on Block #{target_index+1} (ID: {target_row.id}) ---")
        print(f"Original Value: '{original_value}'")
        print(f"Tampered Value: '{malicious_value}'")
        
        target_row.new_value = malicious_value
        db.commit()

        # Step 3: Run verification on tampered ledger
        print("\n--- STEP 3: Running Cryptographic Verification on Tampered Ledger ---")
        valid_after, rep_tampered = verify_audit_ledger(db=db, verbose=True)
        
        assert not valid_after, "Verification MUST fail on tampered ledger!"
        assert len(rep_tampered["violations"]) > 0, "Violations must be reported"
        print("[CONFIRMED] Cryptographic verification detected unauthorized row modification immediately!")
        print(f"Detected violation: {rep_tampered['violations'][0]['type']}")

        # Step 4: Restore original value
        print("\n--- STEP 4: Restoring Original Data & Re-verifying ---")
        target_row.new_value = original_value
        db.commit()
        valid_restored, _ = verify_audit_ledger(db=db, verbose=True)
        assert valid_restored, "Restored ledger must be valid again"
        print("[RESTORED] Ledger restored to original state. Cryptographic integrity confirmed.\n")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VeriBhoomi AI Audit Ledger Verifier")
    parser.add_argument("--test-tamper", action="store_true", help="Simulate data tampering to demonstrate cryptographic detection")
    args = parser.parse_args()

    if args.test_tamper:
        demonstrate_tamper_detection()
    else:
        is_ok, _ = verify_audit_ledger(verbose=True)
        sys.exit(0 if is_ok else 1)
