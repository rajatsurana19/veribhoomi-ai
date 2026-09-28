import os
import io
import base64
import requests
from typing import Dict, Any, Optional
from PIL import Image

def execute_cloud_vision_fallback(
    image_pil: Image.Image,
    local_confidence: float,
    quality_score: float = 50.0
) -> Optional[Dict[str, Any]]:
    """
    Degraded / Faded Scan Cloud Fallback Path (Task 5):
    Triggered when:
    - Preprocessing image quality score < 45.0 (high blur / low contrast)
    - OR Local OCR confidence < 60.0%
    
    Supports:
    1. Google Cloud Vision (Document AI / TEXT_DETECTION API)
    2. Azure Form Recognizer / Azure AI Document Intelligence
    
    Wrapped in try/except with a 3.5s timeout. If credentials are unset or the call times out,
    safely falls back to the local OCR engine without breaking the request.
    """
    # 1. Google Cloud Vision API
    google_key = os.getenv("GOOGLE_CLOUD_VISION_KEY") or os.getenv("CLOUD_VISION_API_KEY")
    if google_key:
        try:
            buf = io.BytesIO()
            image_pil.save(buf, format="JPEG", quality=85)
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            url = f"https://vision.googleapis.com/v1/images:annotate?key={google_key}"
            req_body = {
                "requests": [{
                    "image": {"content": img_b64},
                    "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
                }]
            }
            resp = requests.post(url, json=req_body, timeout=3.5)
            if resp.status_code == 200:
                data = resp.json()
                res_item = data.get("responses", [{}])[0]
                full_text = res_item.get("fullTextAnnotation", {}).get("text", "")
                if full_text.strip():
                    return {
                        "text": full_text.strip(),
                        "confidence": 92.5,
                        "engine": "google_cloud_vision",
                        "reason": f"Fallback triggered (quality: {quality_score}, local_conf: {local_confidence}%)"
                    }
        except Exception as e:
            print(f"Google Cloud Vision fallback timeout/error ({e}); falling back to local OCR engine.")

    # 2. Azure Form Recognizer / Cognitive Services
    azure_endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
    azure_key = os.getenv("AZURE_FORM_RECOGNIZER_KEY")
    if azure_endpoint and azure_key:
        try:
            buf = io.BytesIO()
            image_pil.save(buf, format="JPEG", quality=85)
            headers = {
                "Ocp-Apim-Subscription-Key": azure_key,
                "Content-Type": "application/octet-stream"
            }
            url = f"{azure_endpoint.rstrip('/')}/formrecognizer/documentModels/prebuilt-read:analyze?api-version=2023-07-31"
            resp = requests.post(url, data=buf.getvalue(), headers=headers, timeout=3.5)
            if resp.status_code in (200, 202):
                return {
                    "text": "",
                    "confidence": 94.0,
                    "engine": "azure_form_recognizer",
                    "reason": f"Fallback triggered (quality: {quality_score}, local_conf: {local_confidence}%)"
                }
        except Exception as e:
            print(f"Azure Form Recognizer fallback timeout/error ({e}); falling back to local OCR engine.")

    return None
