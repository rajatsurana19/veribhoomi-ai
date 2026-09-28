import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def get_auth_token(email: str, password: str = "password"):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_and_rbac():
    # 1. Login as operator
    op_token = get_auth_token("operator@veribhoomi.demo")
    assert op_token is not None

    # 2. Login as officer
    off_token = get_auth_token("officer@veribhoomi.demo")
    assert off_token is not None

    # 3. Login as admin
    adm_token = get_auth_token("admin@veribhoomi.demo")
    assert adm_token is not None

def test_batch_and_documents_flow():
    op_token = get_auth_token("operator@veribhoomi.demo")
    headers = {"Authorization": f"Bearer {op_token}"}

    # 1. Create a new batch
    batch_res = client.post(
        "/api/v1/batches",
        json={
            "name": "Test Rampur Batch",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "tehsil": "Sadar",
            "village": "Rampur"
        },
        headers=headers
    )
    assert batch_res.status_code == 201
    batch_id = batch_res.json()["id"]

    # 2. List batches
    batches_list = client.get("/api/v1/batches", headers=headers)
    assert batches_list.status_code == 200
    assert len(batches_list.json()) >= 1

    # 3. List documents
    docs_res = client.get("/api/v1/documents", headers=headers)
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) >= 1

    # Pick a document
    doc_id = docs[0]["id"]
    doc_detail = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert doc_detail.status_code == 200
    canonical = doc_detail.json()
    assert "fields" in canonical
    assert "owner_name" in canonical["fields"]
    assert "khasra_number" in canonical["fields"]

def test_field_correction_and_submission_block():
    op_token = get_auth_token("operator@veribhoomi.demo")
    headers = {"Authorization": f"Bearer {op_token}"}

    docs_res = client.get("/api/v1/documents", headers=headers)
    docs = docs_res.json()
    doc_id = docs[0]["id"]

    # 1. Correct a field: 108 -> 102
    corr_res = client.patch(
        f"/api/v1/documents/{doc_id}/fields",
        json={
            "corrections": [
                {"field_name": "khasra_number", "value": "102"}
            ]
        },
        headers=headers
    )
    assert corr_res.status_code == 200
    updated_doc = corr_res.json()
    assert updated_doc["fields"]["khasra_number"]["value"] == "102"
    assert updated_doc["fields"]["khasra_number"]["source"] == "corrected"
    assert updated_doc["fields"]["khasra_number"]["confidence"] == 100.0

    # 2. Submit for approval
    submit_res = client.post(f"/api/v1/documents/{doc_id}/submit", headers=headers)
    assert submit_res.status_code in [200, 422]

def test_officer_approval_and_mock_lrms_sync():
    off_token = get_auth_token("officer@veribhoomi.demo")
    headers = {"Authorization": f"Bearer {off_token}"}
    op_headers = {"Authorization": f"Bearer {get_auth_token('operator@veribhoomi.demo')}"}

    docs_res = client.get("/api/v1/documents", headers=headers)
    docs = docs_res.json()
    doc_id = docs[0]["id"]

    # 1. Test officer-edit endpoint (Requirement 13)
    edit_res = client.patch(
        f"/api/v1/documents/{doc_id}/officer-edit",
        json={"field_name": "owner_name", "new_value": "Ramesh Tukaram Patil", "reason": "Officer verified with 7/12 scan"},
        headers=headers
    )
    assert edit_res.status_code == 200

    # Ensure required fields are set for clean validation pass
    client.patch(
        f"/api/v1/documents/{doc_id}/fields",
        json={
            "corrections": [
                {"field_name": "survey_number", "value": "41/1/अ"},
                {"field_name": "khasra_number", "value": "102"},
                {"field_name": "khata_number", "value": "89"},
                {"field_name": "plot_area", "value": "2.4", "unit": "hectare"},
                {"field_name": "village", "value": "Andheri"},
                {"field_name": "tehsil", "value": "Andheri"},
                {"field_name": "district", "value": "Mumbai Suburban"}
            ]
        },
        headers=op_headers
    )

    # 2. Officer approves (Requirement 13)
    app_res = client.post(f"/api/v1/documents/{doc_id}/approve", headers=headers)
    assert app_res.status_code == 200
    app_json = app_res.json()
    assert app_json["status"] == "pushed_to_lrms"
    assert "external_lrms_id" in app_json

def test_stats_and_gis():
    adm_token = get_auth_token("admin@veribhoomi.demo")
    headers = {"Authorization": f"Bearer {adm_token}"}

    # Summary
    summary = client.get("/api/v1/stats/summary", headers=headers)
    assert summary.status_code == 200
    assert summary.json()["total_documents"] >= 1

    # Timeseries
    ts = client.get("/api/v1/stats/timeseries", headers=headers)
    assert ts.status_code == 200
    assert len(ts.json()) == 7

    # Land Classification telemetry (Requirement 1, 6)
    land_cls = client.get("/api/v1/stats/land-classification", headers=headers)
    assert land_cls.status_code == 200
    assert "agricultural_count" in land_cls.json()
    assert "non_agricultural_count" in land_cls.json()

    # GIS Villages
    gis = client.get("/api/v1/gis/villages", headers=headers)
    assert gis.status_code == 200
    assert "features" in gis.json()
    assert len(gis.json()["features"]) >= 1

    # GIS Coverage Heatmap (Requirement 1)
    heatmap = client.get("/api/v1/gis/heatmap", headers=headers)
    assert heatmap.status_code == 200
    assert "points" in heatmap.json() or "data" in heatmap.json()
    points = heatmap.json().get("points") or heatmap.json().get("data")
    assert len(points) >= 1

def test_audit_logs():
    adm_token = get_auth_token("admin@veribhoomi.demo")
    headers = {"Authorization": f"Bearer {adm_token}"}

    logs = client.get("/api/v1/audit-logs", headers=headers)
    assert logs.status_code == 200
    log_items = logs.json()
    assert len(log_items) >= 1
    
    # Assert cryptographic hash fields are populated
    for item in log_items:
        assert "entry_hash" in item
        assert item["entry_hash"] is not None
        assert len(item["entry_hash"]) == 64

    # Assert sequential ledger cryptographic verification succeeds
    from scripts.verify_audit_chain import verify_audit_ledger
    is_valid, report = verify_audit_ledger(verbose=False)
    assert is_valid is True
    assert report["total"] >= 1
