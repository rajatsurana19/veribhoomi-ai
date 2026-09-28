import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from rapidfuzz import fuzz

from app.models.master_reference import MasterReference
from app.models.document import Document
from app.models.extracted_field import ExtractedField

class ValidationEngine:
    """
    7-Point Deterministic Land Record Validation & Duplicate Detection Engine
    """
    
    REQUIRED_FIELDS = [
        ("owner_name", "Owner Name (भूस्वामी नाम)"),
        ("survey_number", "Survey Number (सर्वे संख्या)"),
        ("khasra_number", "Khasra Number (खसरा संख्या)"),
        ("khata_number", "Khata Number (खाता संख्या)"),
        ("plot_area", "Plot Area (रकबा / क्षेत्रफल)"),
        ("village", "Village (ग्राम)"),
        ("tehsil", "Tehsil (तहसील)"),
        ("district", "District (ज़िला)")
    ]

    @classmethod
    def validate_document(
        cls,
        db: Session,
        document_id: str,
        fields_dict: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        results: List[Dict[str, Any]] = []
        
        # 1. Required field validation
        for fname, flabel in cls.REQUIRED_FIELDS:
            fdata = fields_dict.get(fname, {})
            val = (fdata.get("value") or "").strip()
            if not val:
                results.append({
                    "rule_name": f"REQUIRED_FIELD_{fname.upper()}",
                    "severity": "ERROR",
                    "message": f"Mandatory field '{flabel}' is missing or blank.",
                    "field_name": fname,
                    "is_blocking": True
                })
            else:
                results.append({
                    "rule_name": f"REQUIRED_FIELD_{fname.upper()}",
                    "severity": "INFO",
                    "message": f"Field '{flabel}' is present.",
                    "field_name": fname,
                    "is_blocking": False
                })

        # 2. Plot area numeric validation
        plot_area_data = fields_dict.get("plot_area", {})
        area_val = (plot_area_data.get("value") or "").strip()
        if area_val:
            try:
                area_num = float(area_val)
                if area_num <= 0 or area_num > 5000:
                    results.append({
                        "rule_name": "PLOT_AREA_NUMERIC_RANGE",
                        "severity": "ERROR",
                        "message": f"Plot area '{area_val}' is out of realistic cadastral bounds (>0 and <5000).",
                        "field_name": "plot_area",
                        "is_blocking": True
                    })
                else:
                    results.append({
                        "rule_name": "PLOT_AREA_NUMERIC_RANGE",
                        "severity": "INFO",
                        "message": f"Plot area '{area_val} {plot_area_data.get('unit', 'acre')}' is in valid format.",
                        "field_name": "plot_area",
                        "is_blocking": False
                    })
            except ValueError:
                results.append({
                    "rule_name": "PLOT_AREA_NUMERIC_RANGE",
                    "severity": "ERROR",
                    "message": f"Plot area value '{area_val}' is not a valid decimal number.",
                    "field_name": "plot_area",
                    "is_blocking": True
                })

        # 3. District existence check
        district_val = (fields_dict.get("district", {}).get("value") or "").strip()
        district_exists = False
        if district_val:
            d_query = db.query(MasterReference).filter(
                MasterReference.district.ilike(f"%{district_val}%")
            ).first()
            if d_query:
                district_exists = True
                results.append({
                    "rule_name": "DISTRICT_MASTER_EXISTS",
                    "severity": "INFO",
                    "message": f"District '{district_val}' verified in State Master Reference.",
                    "field_name": "district",
                    "is_blocking": False
                })
            else:
                results.append({
                    "rule_name": "DISTRICT_MASTER_EXISTS",
                    "severity": "WARNING",
                    "message": f"District '{district_val}' not found in standard state revenue gazetteer.",
                    "field_name": "district",
                    "is_blocking": False
                })

        # 4. Tehsil existence check
        tehsil_val = (fields_dict.get("tehsil", {}).get("value") or "").strip()
        tehsil_exists = False
        if tehsil_val:
            t_query = db.query(MasterReference).filter(
                MasterReference.tehsil.ilike(f"%{tehsil_val}%")
            ).first()
            if t_query:
                tehsil_exists = True
                results.append({
                    "rule_name": "TEHSIL_MASTER_EXISTS",
                    "severity": "INFO",
                    "message": f"Tehsil '{tehsil_val}' verified in Revenue Jurisdiction Master.",
                    "field_name": "tehsil",
                    "is_blocking": False
                })
            else:
                results.append({
                    "rule_name": "TEHSIL_MASTER_EXISTS",
                    "severity": "WARNING",
                    "message": f"Tehsil '{tehsil_val}' not matched in reference gazetteer.",
                    "field_name": "tehsil",
                    "is_blocking": False
                })

        # 5. Village existence check
        village_val = (fields_dict.get("village", {}).get("value") or "").strip()
        village_exists = False
        if village_val:
            v_query = db.query(MasterReference).filter(
                MasterReference.village.ilike(f"%{village_val}%")
            ).first()
            if v_query:
                village_exists = True
                results.append({
                    "rule_name": "VILLAGE_MASTER_EXISTS",
                    "severity": "INFO",
                    "message": f"Village '{village_val}' verified in Cadastral Registry Master.",
                    "field_name": "village",
                    "is_blocking": False
                })
            else:
                results.append({
                    "rule_name": "VILLAGE_MASTER_EXISTS",
                    "severity": "WARNING",
                    "message": f"Village '{village_val}' is unrecognized in master directory.",
                    "field_name": "village",
                    "is_blocking": False
                })

        # 6. Village + Tehsil + District hierarchy combination validation
        if village_val and tehsil_val and district_val:
            combo_match = db.query(MasterReference).filter(
                MasterReference.village.ilike(f"%{village_val}%"),
                MasterReference.tehsil.ilike(f"%{tehsil_val}%"),
                MasterReference.district.ilike(f"%{district_val}%")
            ).first()
            if combo_match:
                results.append({
                    "rule_name": "GEO_HIERARCHY_COMBINATION",
                    "severity": "INFO",
                    "message": f"Jurisdiction hierarchy '{village_val} -> {tehsil_val} -> {district_val}' is fully valid.",
                    "field_name": "village",
                    "is_blocking": False
                })
            else:
                results.append({
                    "rule_name": "GEO_HIERARCHY_COMBINATION",
                    "severity": "WARNING",
                    "message": f"Hierarchy cross-reference warning: '{village_val}' may not belong to '{tehsil_val}, {district_val}'.",
                    "field_name": "village",
                    "is_blocking": False
                })

        # 7. Duplicate Detection using RapidFuzz (Optimized with Eager Jurisdictional Pre-Filter)
        khasra_val = (fields_dict.get("khasra_number", {}).get("value") or "").strip()
        if village_val and khasra_val:
            from sqlalchemy.orm import joinedload
            
            # Pre-filter candidate documents by joining ExtractedField on matching village
            candidate_docs = db.query(Document).join(Document.fields).filter(
                Document.id != document_id,
                Document.status.in_(["approved", "pushed_to_lrms", "reviewed"]),
                ExtractedField.field_name == "village",
                ExtractedField.value.ilike(f"%{village_val}%")
            ).options(joinedload(Document.fields)).limit(100).all()

            duplicate_found = False
            for prev_doc in candidate_docs:
                p_fields = {f.field_name: f.value for f in prev_doc.fields if f.value}
                prev_v = p_fields.get("village", "")
                prev_k = p_fields.get("khasra_number", "")

                if prev_v and prev_k:
                    v_sim = fuzz.ratio(village_val.lower(), prev_v.lower())
                    k_sim = fuzz.ratio(khasra_val.lower(), prev_k.lower())
                    
                    if v_sim > 85 and k_sim > 85:
                        duplicate_found = True
                        results.append({
                            "rule_name": "DUPLICATE_KHASRA_DETECTION",
                            "severity": "WARNING",
                            "message": f"Possible duplicate record detected: Khasra '{khasra_val}' in village '{village_val}' closely matches Record {prev_doc.id[:8]} ({prev_doc.status}).",
                            "field_name": "khasra_number",
                            "is_blocking": False,
                            "details": f"Match ratio: Village={v_sim}%, Khasra={k_sim}%"
                        })
                        break
            
            if not duplicate_found:
                results.append({
                    "rule_name": "DUPLICATE_KHASRA_DETECTION",
                    "severity": "INFO",
                    "message": "No conflicting duplicate Khasra records found in registry.",
                    "field_name": "khasra_number",
                    "is_blocking": False
                })

        # 8. Human-in-the-loop Low Confidence Rule check:
        # If any field has confidence < 60% with source == "auto", can_submit MUST be False!
        has_uncorrected_low_conf = False
        for fname, fdata in fields_dict.items():
            conf = float(fdata.get("confidence", 100))
            src = fdata.get("source", "auto")
            if conf < 60.0 and src == "auto":
                has_uncorrected_low_conf = True
                results.append({
                    "rule_name": f"LOW_CONFIDENCE_UNCORRECTED_{fname.upper()}",
                    "severity": "WARNING",
                    "message": f"Field '{fname}' has low AI confidence ({conf}%) and requires manual human operator verification.",
                    "field_name": fname,
                    "is_blocking": False
                })

        error_count = sum(1 for r in results if r["severity"] == "ERROR")
        warning_count = sum(1 for r in results if r["severity"] == "WARNING")
        passed_count = sum(1 for r in results if r["severity"] == "INFO")

        # can_submit is False if there are blocking ERRORs OR uncorrected low-confidence fields
        can_submit = (error_count == 0) and (not has_uncorrected_low_conf)
        # can_approve is False if there are blocking ERRORs
        can_approve = (error_count == 0)

        return {
            "document_id": document_id,
            "total_checks": len(results),
            "passed_count": passed_count,
            "warning_count": warning_count,
            "error_count": error_count,
            "can_submit": can_submit,
            "can_approve": can_approve,
            "has_uncorrected_low_confidence": has_uncorrected_low_conf,
            "results": results
        }
