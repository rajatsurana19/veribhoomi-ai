import os
import sys
import json
import shutil
import uuid
import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add app directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.master_reference import MasterReference
from app.models.batch import Batch
from app.models.document import Document
from app.dependencies import get_password_hash
from app.services.document_service import DocumentService
from app.config import settings

def seed_database():
    print("=" * 60)
    print("VERIBHOOMI AI — DATABASE INITIALIZATION & SEEDING (MAHARASHTRA 7/12)")
    print("=" * 60)

    # 1. Create all schema tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 2. Seed System Department Users
        demo_users = [
            {
                "email": "operator@veribhoomi.gov",
                "password": "password",
                "full_name": "Ramesh Patil (तलाठी / Revenue Operator)",
                "role": "operator",
                "department": "Revenue Circle Office Khalapur & Andheri",
                "designation": "Talathi / Revenue Staff"
            },
            {
                "email": "officer@veribhoomi.gov",
                "password": "password",
                "full_name": "V. K. Shinde (तहसीलदार / Approving Officer)",
                "role": "officer",
                "department": "Taluka Revenue Court & Land Records Registry",
                "designation": "Tehsildar / Sub-Divisional Magistrate"
            },
            {
                "email": "admin@veribhoomi.gov",
                "password": "password",
                "full_name": "Dr. Sunita Rao (जिल्हाधिकारी / Collector)",
                "role": "admin",
                "department": "District Revenue Headquarters Maharashtra",
                "designation": "District Collector & Cadastral Admin"
            },
            {
                "email": "operator@veribhoomi.demo",
                "password": "password",
                "full_name": "Ramesh Patil (तलाठी / Revenue Operator)",
                "role": "operator",
                "department": "Revenue Circle Office Khalapur & Andheri",
                "designation": "Talathi / Revenue Staff"
            },
            {
                "email": "officer@veribhoomi.demo",
                "password": "password",
                "full_name": "V. K. Shinde (तहसीलदार / Approving Officer)",
                "role": "officer",
                "department": "Taluka Revenue Court & Land Records Registry",
                "designation": "Tehsildar / Sub-Divisional Magistrate"
            },
            {
                "email": "admin@veribhoomi.demo",
                "password": "password",
                "full_name": "Dr. Sunita Rao (जिल्हाधिकारी / Collector)",
                "role": "admin",
                "department": "District Revenue Headquarters Maharashtra",
                "designation": "District Collector & Cadastral Admin"
            }
        ]

        created_users = {}
        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user_obj = User(
                    id=str(uuid.uuid4()),
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    department=u["department"],
                    designation=u["designation"]
                )
                db.add(user_obj)
                db.commit()
                db.refresh(user_obj)
                created_users[u["role"]] = user_obj
                print(f" Created demo user: {u['email']} [{u['role']}]")
            else:
                existing.hashed_password = get_password_hash(u["password"])
                db.commit()
                created_users[u["role"]] = existing
                print(f" Updated password for demo user: {u['email']} [{u['role']}]")

        # 3. Seed Master Revenue Reference Jurisdictions (Maharashtra)
        master_json_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "sample-data", "master_reference.json")
        )
        if os.path.exists(master_json_path):
            with open(master_json_path, "r", encoding="utf-8") as f:
                ref_list = json.load(f)
            
            inserted_count = 0
            for ref in ref_list:
                exists = db.query(MasterReference).filter(
                    MasterReference.village == ref["village"],
                    MasterReference.tehsil == ref["tehsil"],
                    MasterReference.district == ref["district"]
                ).first()
                if not exists:
                    mr = MasterReference(
                        state=ref["state"],
                        district=ref["district"],
                        tehsil=ref["tehsil"],
                        village=ref["village"],
                        census_code=ref.get("census_code")
                    )
                    db.add(mr)
                    inserted_count += 1
            db.commit()
            print(f" Seeded {inserted_count} Maharashtra Master Revenue Jurisdictions.")

        # 4. Seed Real Maharashtra 7/12 Demonstration Batches & Documents
        operator_user = created_users.get("operator")
        if operator_user:
            os.makedirs(settings.ORIGINAL_SCANS_DIR, exist_ok=True)
            data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))

            batches_to_create = [
                {
                    "name": "रायगड जिल्हा — कलोते व पोसरी ७/१२ अभिलेख (Batch 01)",
                    "state": "Maharashtra",
                    "district": "रायगड (Raigad)",
                    "tehsil": "खालापूर (Khalapur)",
                    "village": "कलोते रयती (Kalote Rayati)",
                    "files": [
                        ("Kalote Rayati 7 12.pdf", "कलोते रयती ७/१२ उतारा - गट ९३/१"),
                        ("Report 7 12.pdf", "पोसरी ७/१२ उतारा - गट ५१/१/अ")
                    ]
                },
                {
                    "name": "मुंबई उपनगर — अंधेरी व ओशिवरा ७/१२ अभिलेख (Batch 02)",
                    "state": "Maharashtra",
                    "district": "मुंबई उपनगर (Mumbai Suburban)",
                    "tehsil": "अंधेरी (Andheri)",
                    "village": "ओशिवरा (Oshivara)",
                    "files": [
                        ("andheri oshiwara 1.pdf", "अंधेरी ओशिवरा ७/१२ उतारा - गट ४१/१/अ"),
                        ("andheri ns190.pdf", "अंधेरी नगर भूमापन ७/१२ - एन.ए./१९०"),
                        ("kurla 1.pdf", "कुर्ला गावठाण ७/१२ उतारा - गट १०५/अ")
                    ]
                }
            ]

            for b_info in batches_to_create:
                existing_batch = db.query(Batch).filter(Batch.name == b_info["name"]).first()
                if not existing_batch:
                    batch = Batch(
                        id=str(uuid.uuid4()),
                        name=b_info["name"],
                        state=b_info["state"],
                        district=b_info["district"],
                        tehsil=b_info["tehsil"],
                        village=b_info["village"],
                        status="active",
                        created_by=operator_user.id
                    )
                    db.add(batch)
                    db.commit()
                    db.refresh(batch)
                    print(f" Created demonstration batch: {batch.name}")

                    for fname, desc in b_info["files"]:
                        src = os.path.join(data_dir, fname)
                        if os.path.exists(src):
                            dest = os.path.join(settings.ORIGINAL_SCANS_DIR, fname)
                            shutil.copy2(src, dest)
                            file_size = os.path.getsize(dest)
                            doc_id = str(uuid.uuid4())

                            print(f" -> Processing scanned Maharashtra 7/12 record: {fname} ({desc})...")
                            DocumentService.process_new_document(
                                db=db,
                                document_id=doc_id,
                                batch_id=batch.id,
                                filename=fname,
                                storage_path=dest,
                                public_url=f"/api/v1/documents/{doc_id}/scan",
                                file_size_bytes=file_size,
                                creator=operator_user
                            )

                    batch.total_documents = len(b_info["files"])
                    db.commit()

        # 5. Populate GeoJSON Cadastral Boundaries
        try:
            from scripts.migrate_geojson_to_postgis import run_migration
            run_migration()
        except Exception as e:
            print(f"Notice: GeoJSON migration skipped or already completed: {e}")

        print("\n Seeding completed successfully! Real Maharashtra 7/12 records are ready.")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
