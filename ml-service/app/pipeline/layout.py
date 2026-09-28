from typing import List, Dict, Any
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

def detect_document_regions(image_pil: Image.Image) -> List[Dict[str, Any]]:
    """
    Detects document regions such as:
    - Header (Government Seals, Title, District/Tehsil/Village metadata)
    - Tabular Record Grid (Khasra, Survey, Khata, Area)
    - Ownership Section (Names, Share, Caste/Category)
    - Footer (Patwari/Tehsildar Signature, Seal, Mutation Notes)
    """
    w, h = image_pil.size
    
    # Define standard canonical land record layout regions
    regions = [
        {
            "region_id": "header_metadata",
            "name": "Header & Revenue Jurisdiction",
            "bbox": [0, 0, w, int(h * 0.25)],
            "type": "printed_metadata"
        },
        {
            "region_id": "ownership_details",
            "name": "Owner & Landholder Registry",
            "bbox": [0, int(h * 0.25), w, int(h * 0.55)],
            "type": "mixed_text"
        },
        {
            "region_id": "cadastral_metrics",
            "name": "Khasra, Khata & Plot Area Grid",
            "bbox": [0, int(h * 0.55), w, int(h * 0.80)],
            "type": "tabular_metrics"
        },
        {
            "region_id": "mutation_footer",
            "name": "Mutation History & Endorsements",
            "bbox": [0, int(h * 0.80), w, h],
            "type": "handwritten_notes"
        }
    ]

    return regions
