"""
Migration Script: GeoJSON to PostGIS / MasterReference
1. Ensures PostGIS extension is installed if PostgreSQL connection is active
2. Adds 'geom' geometry column (SRID 4326, Polygon) and GIST index if missing
3. Populates polygons from sample-data/geojson/villages.geojson into master_reference table
4. Populates boundary_geojson text column for portable query streaming
"""
import os
import sys
import json
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, SessionLocal
from app.models.master_reference import MasterReference
from app.config import settings

def run_migration():
    print("=" * 70)
    print("MIGRATING VILLAGE GEOJSON BOUNDARIES TO DATABASE / POSTGIS")
    print("=" * 70)

    db = SessionLocal()
    is_postgres = not settings.DATABASE_URL.startswith("sqlite")
    print(f"Target Database Engine: {'PostgreSQL / PostGIS' if is_postgres else 'SQLite (Local Fallback)'}")

    try:
        # Ensure boundary_geojson column exists on master_reference
        try:
            with engine.connect() as conn:
                if is_postgres:
                    print("1. Ensuring PostGIS extension is active...")
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                    
                    print("2. Ensuring 'geom' geometry(Polygon, 4326) and 'boundary_geojson' columns exist...")
                    conn.execute(text("""
                        DO $$ 
                        BEGIN 
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name='master_reference' AND column_name='geom'
                            ) THEN 
                                ALTER TABLE master_reference ADD COLUMN geom geometry(Polygon, 4326);
                            END IF; 
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name='master_reference' AND column_name='boundary_geojson'
                            ) THEN 
                                ALTER TABLE master_reference ADD COLUMN boundary_geojson TEXT;
                            END IF; 
                        END $$;
                    """))

                    print("3. Ensuring GIST spatial index exists on master_reference(geom)...")
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_master_reference_geom_gist 
                        ON master_reference USING GIST (geom);
                    """))
                    conn.commit()
                    print("PostGIS DDL & GIST index verified.")
                else:
                    # SQLite fallback migration
                    try:
                        conn.execute(text("ALTER TABLE master_reference ADD COLUMN boundary_geojson TEXT;"))
                        conn.commit()
                        print("Added boundary_geojson column to SQLite master_reference table.")
                    except Exception:
                        pass # Already exists
        except Exception as e:
            print(f"Notice during schema check: {e}")

        # Load GeoJSON features
        geojson_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "sample-data", "geojson", "villages.geojson")
        )
        if not os.path.exists(geojson_path):
            raise FileNotFoundError(f"GeoJSON file not found at: {geojson_path}")

        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        features = data.get("features", [])
        print(f"Loaded {len(features)} village boundary features from {os.path.basename(geojson_path)}.")

        updated_count = 0
        inserted_count = 0

        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            geom_str = json.dumps(geom)

            v_name = props.get("village_name")
            tehsil = props.get("tehsil")
            district = props.get("district")
            state = props.get("state", "Uttar Pradesh")
            census_code = props.get("village_id")

            # Look up existing master reference record
            record = db.query(MasterReference).filter(
                MasterReference.village == v_name,
                MasterReference.tehsil == tehsil,
                MasterReference.district == district
            ).first()

            if not record:
                record = MasterReference(
                    state=state,
                    district=district,
                    tehsil=tehsil,
                    village=v_name,
                    census_code=census_code,
                    boundary_geojson=geom_str
                )
                db.add(record)
                db.commit()
                db.refresh(record)
                inserted_count += 1
            else:
                record.boundary_geojson = geom_str
                db.commit()
                updated_count += 1

            # If connected to PostgreSQL, update the binary PostGIS geometry column using ST_GeomFromGeoJSON
            if is_postgres:
                with engine.connect() as conn:
                    conn.execute(
                        text("""
                            UPDATE master_reference 
                            SET geom = ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326)
                            WHERE id = :rec_id
                        """),
                        {"geom_json": geom_str, "rec_id": record.id}
                    )
                    conn.commit()

        print(f"Successfully processed geometries: {inserted_count} inserted, {updated_count} updated.")

        # Verification check
        total_with_geo = db.query(MasterReference).filter(MasterReference.boundary_geojson.isnot(None)).count()
        print(f"Total MasterReference records with cadastral boundaries: {total_with_geo}")
        print("GeoJSON to PostGIS / Database Migration Complete!\n")

    except Exception as e:
        db.rollback()
        print(f"Migration Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
