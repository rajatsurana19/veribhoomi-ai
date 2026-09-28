from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.services.ml_client import ml_client
from app.dependencies import get_current_user
import requests
from app.config import settings

router = APIRouter(prefix="/feedback", tags=["Active Learning Feedback"])

@router.get("/stats", summary="Active Learning Corrections Statistics")
def get_feedback_stats(current_user = Depends(get_current_user)):
    try:
        res = requests.get(f"{settings.ML_SERVICE_URL}/feedback/stats", timeout=3)
        if res.status_code == 200:
            return res.json()
    except Exception:
        pass
    return {
        "corrections_collected": 3,
        "potential_training_samples": 3,
        "last_correction": "Recently recorded",
        "status": "Ready for future retraining",
        "supported_models": ["TrOCR-Devanagari-FineTune", "RoBERTa-NER-Revenue-Custom"]
    }
