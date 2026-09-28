"""
Generate degraded document scans for testing Cloud Vision fallback.
Degrades image quality to score below 45.0 (blur, reduced contrast, luminance drop).
"""
import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(base_dir, "ml-service"))

from app.pipeline.preprocess import calculate_image_quality

def generate_degraded_scan(source_path: str, output_path: str) -> dict:
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source file not found: {source_path}")
    
    img = Image.open(source_path).convert("RGB")
    deg = img.filter(ImageFilter.GaussianBlur(radius=6.0))
    enhancer = ImageEnhance.Contrast(deg)
    deg = enhancer.enhance(0.3)
    b_enhancer = ImageEnhance.Brightness(deg)
    deg = b_enhancer.enhance(0.7)
    
    quality = calculate_image_quality(np.array(deg))
    deg.save(output_path)
    return quality

if __name__ == "__main__":
    src = os.path.join(base_dir, "sample-data", "documents", "sample_01.png")
    dst = os.path.join(base_dir, "sample-data", "documents", "sample_degraded_01.png")
    
    q = generate_degraded_scan(src, dst)
    print(f"Generated degraded scan at: {dst}")
    print(f"Quality Score: {q['quality_score']}% (Status: {q['status']}, is_acceptable: {q['is_acceptable']})")
    assert q['quality_score'] < 45.0, f"Quality score {q['quality_score']} must be below 45.0"
    print("Degraded scan generator verified successfully!")
