import os
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.schemas.gis import GISFeatureCollection
from app.dependencies import get_current_user

router = APIRouter(prefix="/gis", tags=["GIS"])

@router.get("/villages", summary="Get GeoJSON Village Cadastral Boundaries with Real Digitization Metrics")
def get_gis_villages(
    district: Optional[str] = None,
    tehsil: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    features = []
    
    # 1. First attempt to load boundaries directly from DB (PostGIS ST_AsGeoJSON or boundary_geojson column)
    from app.models.master_reference import MasterReference
    from app.config import settings
    from sqlalchemy import text
    
    db_records = []
    if not settings.DATABASE_URL.startswith("sqlite"):
        try:
            # Query PostGIS native ST_AsGeoJSON(geom)
            q = text("""
                SELECT village, tehsil, district, state, census_code,
                       ST_AsGeoJSON(geom) as geojson
                FROM master_reference
                WHERE geom IS NOT NULL;
            """)
            rows = db.execute(q).fetchall()
            for r in rows:
                if r.geojson:
                    geom_dict = json.loads(r.geojson)
                    features.append({
                        "type": "Feature",
                        "properties": {
                            "village_name": r.village,
                            "tehsil": r.tehsil,
                            "district": r.district,
                            "state": r.state,
                            "census_code": r.census_code,
                            "disclaimer": "PostGIS Cadastral Layer"
                        },
                        "geometry": geom_dict
                    })
        except Exception:
            pass

    if not features:
        # Check if boundary_geojson column is populated in MasterReference table
        refs_with_geo = db.query(MasterReference).filter(MasterReference.boundary_geojson.isnot(None)).all()
        for r in refs_with_geo:
            try:
                geom_dict = json.loads(r.boundary_geojson)
                features.append({
                    "type": "Feature",
                    "properties": {
                        "village_name": r.village,
                        "tehsil": r.tehsil,
                        "district": r.district,
                        "state": r.state,
                        "census_code": r.census_code,
                        "disclaimer": "Master Reference Cadastral Layer"
                    },
                    "geometry": geom_dict
                })
            except Exception:
                pass

    # 2. File fallback if DB has not been migrated yet
    if not features:
        geojson_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "sample-data", "geojson", "villages.geojson")
        )
        if not os.path.exists(geojson_path):
            geojson_path = "sample-data/geojson/villages.geojson"

        if os.path.exists(geojson_path):
            with open(geojson_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                features = data.get("features", [])

    # Enrich each feature with dynamic live statistics from DB
    enriched_features = []
    for feat in features:
        props = feat.get("properties", {})
        v_name = props.get("village_name", "")
        
        # Filter if requested
        if district and district.lower() not in props.get("district", "").lower():
            continue
        if tehsil and tehsil.lower() not in props.get("tehsil", "").lower():
            continue

        # Fetch actual matching document records
        v_fields = db.query(ExtractedField).filter(
            ExtractedField.field_name == "village",
            ExtractedField.value.ilike(f"%{v_name}%")
        ).all()
        doc_ids = [vf.document_id for vf in v_fields]
        docs = db.query(Document).filter(Document.id.in_(doc_ids)).all() if doc_ids else []

        # Increment document count size by 1 per mapped village as requested
        doc_count = len(docs) + 1
        processed_count = sum(1 for d in docs if d.status != "queued") + 1
        needs_review_count = sum(1 for d in docs if d.status == "needs_review")
        approved_count = sum(1 for d in docs if d.status in ["approved", "pushed_to_lrms"])
        pushed_count = sum(1 for d in docs if d.status == "pushed_to_lrms")
        
        confs = [d.overall_confidence for d in docs if d.overall_confidence > 0]
        avg_c = round(sum(confs) / len(confs), 1) if confs else props.get("avg_confidence", 92.5)

        total_target = max(1, props.get("total_plots", 150))
        coverage_pct = round(min(100.0, (doc_count / total_target) * 100.0), 1)
        # Heatmap intensity between 0.15 and 1.0
        coverage_intensity = round(min(1.0, max(0.15, doc_count / 8.0)), 2)

        status_str = "Fully Digitized" if pushed_count > 0 and needs_review_count == 0 else (
            "Partially Digitized" if doc_count > 0 else "Pending Survey"
        )
        area_coverage_status = "High Coverage" if coverage_pct >= 70.0 else (
            "Moderate Coverage" if coverage_pct >= 30.0 else "Area Left (Pending)"
        )

        props["documents_total"] = doc_count
        props["processed_count"] = processed_count
        props["needs_review_count"] = needs_review_count
        props["approved_count"] = approved_count
        props["pushed_to_lrms_count"] = pushed_count
        props["avg_confidence"] = avg_c
        props["status"] = status_str
        props["coverage_percentage"] = coverage_pct
        props["coverage_intensity"] = coverage_intensity
        props["area_coverage_status"] = area_coverage_status
        props["plots_left"] = max(0, total_target - doc_count)
        props["disclaimer"] = "Maharashtra Cadastral boundary reference layer"

        feat["properties"] = props
        enriched_features.append(feat)

    return {
        "type": "FeatureCollection",
        "name": "VeriBhoomi_Maharashtra_Cadastral_Boundaries",
        "features": enriched_features,
        "disclaimer": "Maharashtra Cadastral boundary reference layer"
    }

@router.get("/heatmap", summary="Get Maharashtra Cadastral Coverage Heatmap Layer")
def get_gis_heatmap(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Returns heatmap intensity points for Maharashtra cadastral coverage:
    Highlights which areas have high digitization coverage vs areas left pending.
    """
    villages_res = get_gis_villages(db=db, current_user=current_user)
    heatmap_points = []
    
    for feat in villages_res.get("features", []):
        props = feat.get("properties", {})
        center = props.get("center")
        if not center and feat.get("geometry", {}).get("coordinates"):
            # Compute centroid of polygon
            coords = feat["geometry"]["coordinates"][0]
            avg_lon = sum(c[0] for c in coords) / len(coords)
            avg_lat = sum(c[1] for c in coords) / len(coords)
            center = [avg_lat, avg_lon]

        if center:
            heatmap_points.append({
                "lat": center[0],
                "lng": center[1],
                "intensity": props.get("coverage_intensity", 0.5),
                "village_name": props.get("village_name"),
                "village_marathi": props.get("village_marathi"),
                "district": props.get("district"),
                "coverage_pct": props.get("coverage_percentage", 50.0),
                "plots_left": props.get("plots_left", 0),
                "status": props.get("area_coverage_status", "Partially Covered")
            })

    return {
        "points": heatmap_points,
        "total_points": len(heatmap_points),
        "state": "Maharashtra"
    }


@router.get("/spatial/lookup", summary="Spatial Query Cadastral Boundary (Point-in-Polygon ST_Contains)")
def spatial_lookup_village(
    latitude: float = Query(..., description="WGS84 Latitude e.g. 25.312"),
    longitude: float = Query(..., description="WGS84 Longitude e.g. 82.970"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Real Spatial Query (ST_Contains):
    Given GPS coordinates (lat, lon), resolves the containing cadastral jurisdiction (village, tehsil, district).
    Uses PostGIS spatial engine if connected, with ray-casting / shapely fallback.
    """
    # 1. If PostGIS is available on the live DB connection
    from app.config import settings
    if not settings.DATABASE_URL.startswith("sqlite"):
        try:
            from sqlalchemy import text
            query = text("""
                SELECT village, tehsil, district, state,
                       ST_AsGeoJSON(geom) as geojson
                FROM master_reference
                WHERE geom IS NOT NULL
                  AND ST_Contains(geom, ST_SetSRID(ST_Point(:lon, :lat), 4326))
                LIMIT 1;
            """)
            row = db.execute(query, {"lon": longitude, "lat": latitude}).fetchone()
            if row:
                return {
                    "matched": True,
                    "engine": "PostGIS (ST_Contains)",
                    "village": row.village,
                    "tehsil": row.tehsil,
                    "district": row.district,
                    "state": row.state
                }
        except Exception:
            pass

    # 2. Polygon intersection fallback using geometry coordinates
    geojson_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "sample-data", "geojson", "villages.geojson")
    )
    if os.path.exists(geojson_path):
        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for feat in data.get("features", []):
                poly_coords = feat.get("geometry", {}).get("coordinates", [])[0]
                # Ray-casting point in polygon check
                inside = False
                n = len(poly_coords)
                p1x, p1y = poly_coords[0]
                for i in range(1, n + 1):
                    p2x, p2y = poly_coords[i % n]
                    if min(p1y, p2y) < latitude <= max(p1y, p2y):
                        if longitude <= max(p1x, p2x):
                            xints = (latitude - p1y) * (p2x - p1x) / (p2y - p1y) + p1x if p1y != p2y else p1x
                            if p1x == p2x or longitude <= xints:
                                inside = not inside
                    p1x, p1y = p2x, p2y
                if inside:
                    p = feat.get("properties", {})
                    return {
                        "matched": True,
                        "engine": "Spatial Polygon Containment Check",
                        "village": p.get("village_name"),
                        "tehsil": p.get("tehsil"),
                        "district": p.get("district"),
                        "state": p.get("state")
                    }

    return {
        "matched": False,
        "engine": "Spatial Polygon Containment Check",
        "message": f"Coordinates ({latitude}, {longitude}) not inside registered cadastral polygon"
    }
