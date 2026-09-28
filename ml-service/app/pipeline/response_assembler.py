from typing import Dict, Any, List

def compute_overall_confidence(fields: Dict[str, Dict[str, Any]], ocr_meta: Dict[str, Any]) -> float:
    """
    Computes overall record confidence using the explainable formula:
    
    overall_confidence = 0.7 * OCR_confidence + 0.3 * field_completeness_consistency
    
    Where:
    - OCR_confidence is the weighted average of individual field recognition confidences
    - field_completeness_consistency is the ratio of extracted valid required fields
    """
    if not fields:
        return 0.0

    field_confidences = [
        float(f.get("confidence", 0)) for f in fields.values() if isinstance(f, dict)
    ]
    
    avg_field_conf = sum(field_confidences) / len(field_confidences) if field_confidences else 50.0
    
    # Check consistency of critical mandatory fields
    critical_fields = ["owner_name", "khasra_number", "village", "district", "plot_area"]
    present_critical = sum(
        1 for k in critical_fields if k in fields and fields[k].get("value")
    )
    consistency_score = (present_critical / len(critical_fields)) * 100.0

    # Explainable weighted aggregation
    overall = (0.70 * avg_field_conf) + (0.30 * consistency_score)
    return round(max(0.0, min(100.0, overall)), 1)

def assemble_canonical_response(
    document_id: str,
    batch_id: str,
    fields: Dict[str, Dict[str, Any]],
    ocr_meta: Dict[str, Any],
    original_scan_url: str = ""
) -> Dict[str, Any]:
    """
    Assembles the final Canonical Land Record payload adhering strictly to Section 4 contract.
    """
    overall_conf = compute_overall_confidence(fields, ocr_meta)
    
    # Determine initial status
    # Low confidence or any field < 60% flags 'needs_review'
    has_low_conf = any(
        float(f.get("confidence", 100)) < 60.0 for f in fields.values() if isinstance(f, dict)
    )
    initial_status = "needs_review" if (has_low_conf or overall_conf < 85.0) else "processing"

    return {
        "document_id": document_id,
        "batch_id": batch_id,
        "fields": fields,
        "overall_confidence": overall_conf,
        "status": initial_status,
        "original_scan_url": original_scan_url,
        "preprocessing_metadata": ocr_meta
    }
