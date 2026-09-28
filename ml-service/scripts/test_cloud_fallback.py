"""
Verification Script for Degraded Scan Cloud Fallback Path (Task 2)
Tests:
1. Fallback trigger condition: quality score < 45.0 or OCR confidence < 60.0%
2. Live fallback to Google Cloud Vision when key is configured
3. Graceful degradation to local OCR engine when key is unset or network fails (zero crashing)
"""
import os
import sys
import io
from PIL import Image
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.pipeline.preprocess import preprocess_document_image
from app.pipeline.ocr_cloud_fallback import execute_cloud_vision_fallback
from app.pipeline.ocr_printed import perform_printed_ocr

def test_cloud_fallback_behavior():
    print("=== Testing Cloud Vision Fallback Trigger & Graceful Degradation ===")
    
    degraded_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data", "documents", "sample_degraded_01.png"))
    assert os.path.exists(degraded_path), f"Degraded sample scan not found at {degraded_path}"
    
    with open(degraded_path, "rb") as f:
        raw_bytes = f.read()
        
    processed_pil, quality_meta = preprocess_document_image(raw_bytes)
    quality_score = quality_meta["quality_score"]
    print(f"Loaded degraded image: quality_score = {quality_score}% (Threshold: < 45.0%)")
    
    # 1. Verify trigger condition
    should_trigger = quality_score < 45.0
    assert should_trigger, f"Quality score {quality_score} was expected to trigger cloud fallback (< 45.0)"
    print(" [OK] Trigger condition successfully satisfied (quality_score < 45.0)")

    # 2. Test Graceful Degradation when GOOGLE_CLOUD_VISION_KEY is unset
    print("\n--- Subtest A: Graceful Degradation (Credentials Unset) ---")
    with patch.dict(os.environ, {}, clear=True):
        res = execute_cloud_vision_fallback(
            processed_pil,
            local_confidence=35.0,
            quality_score=quality_score
        )
        assert res is None, f"Expected None fallback result when no key is set, got {res}"
        local_res = perform_printed_ocr(processed_pil)
        assert "confidence" in local_res and "text" in local_res
        print(f" [OK] Safely degraded to local OCR ({local_res.get('engine')}) with zero errors or unhandled exceptions.")

    # 3. Test Active Cloud Vision Fallback when GOOGLE_CLOUD_VISION_KEY is provided
    print("\n--- Subtest B: Active Cloud Vision Fallback Trigger & Response ---")
    mock_cloud_text = "उत्तर प्रदेश राजस्व विभाग खतौनी उद्धरण 108 Rampur 2.45 acre"
    mock_api_response = MagicMock()
    mock_api_response.status_code = 200
    mock_api_response.json.return_value = {
        "responses": [{
            "fullTextAnnotation": {
                "text": mock_cloud_text
            }
        }]
    }

    with patch.dict(os.environ, {"GOOGLE_CLOUD_VISION_KEY": "AIzaSyFakeKeyDemoDaySIH2026"}):
        with patch("requests.post", return_value=mock_api_response) as mock_post:
            fallback_res = execute_cloud_vision_fallback(
                processed_pil,
                local_confidence=35.0,
                quality_score=quality_score
            )
            assert fallback_res is not None, "Expected valid fallback response from Cloud Vision"
            assert fallback_res["engine"] == "google_cloud_vision"
            assert fallback_res["confidence"] == 92.5
            assert fallback_res["text"] == mock_cloud_text
            assert "Fallback triggered" in fallback_res["reason"]
            print(f" [OK] Cloud Vision Fallback executed successfully: engine={fallback_res['engine']}, confidence={fallback_res['confidence']}%")
            print(f" [OK] Reason logged: {fallback_res['reason']}")

    # 4. Test Timeout Resilience (3.5s timeout safety)
    print("\n--- Subtest C: Timeout & Network Error Resilience ---")
    import requests
    with patch.dict(os.environ, {"GOOGLE_CLOUD_VISION_KEY": "AIzaSyFakeKeyDemoDaySIH2026"}):
        with patch("requests.post", side_effect=requests.exceptions.Timeout("Connection timed out after 3.5s")):
            timeout_res = execute_cloud_vision_fallback(
                processed_pil,
                local_confidence=35.0,
                quality_score=quality_score
            )
            assert timeout_res is None, "Expected None fallback when cloud call times out"
            print(" [OK] 3.5s timeout caught gracefully; pipeline continues execution without interruption.")

    print("\n=== All Cloud Vision Fallback Verification Tests PASSED! ===\n")

if __name__ == "__main__":
    test_cloud_fallback_behavior()