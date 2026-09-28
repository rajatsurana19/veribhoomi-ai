import io
import os
import math
from typing import Tuple, Dict, Any, List
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

def calculate_image_quality(image_np: np.ndarray) -> Dict[str, Any]:
    """
    Computes image quality metrics:
    - Laplacian variance (sharpness / blur measure)
    - Contrast ratio
    - Overall quality score (0 - 100)
    """
    if len(image_np.shape) == 3:
        if HAS_OPENCV:
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        else:
            gray = np.mean(image_np, axis=2).astype(np.uint8)
    else:
        gray = image_np

    # 1. Sharpness measure via Laplacian variance
    if HAS_OPENCV:
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    else:
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        pad = np.pad(gray.astype(np.float32), 1, mode='edge')
        h, w = gray.shape
        conv = (
            pad[0:h, 1:w+1] + pad[2:h+2, 1:w+1] +
            pad[1:h+1, 0:w] + pad[1:h+1, 2:w+2] - 4 * gray
        )
        laplacian_var = float(np.var(conv))

    # 2. Contrast estimation (Standard deviation of luminance)
    contrast = float(np.std(gray))

    # 3. Overall quality computation (0 - 100)
    sharpness_score = min(100.0, (laplacian_var / 120.0) * 100.0)
    contrast_score = min(100.0, (contrast / 65.0) * 100.0)

    quality_score = round(0.6 * sharpness_score + 0.4 * contrast_score, 1)
    is_acceptable = quality_score >= 40.0

    return {
        "sharpness_laplacian": round(laplacian_var, 2),
        "contrast_std": round(contrast, 2),
        "quality_score": quality_score,
        "is_acceptable": is_acceptable,
        "status": "Good" if quality_score >= 70 else ("Fair" if quality_score >= 45 else "Poor / Blurry")
    }

def deskew_image(image_np: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Detects skew angle via minAreaRect and rotates the image back to true horizontal.
    """
    if not HAS_OPENCV:
        return image_np, 0.0

    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY) if len(image_np.shape) == 3 else image_np
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 50:
        return image_np, 0.0

    angle = cv2.minAreaRect(coords)[-1]
    
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) > 20:
        angle = 0.0

    if abs(angle) > 0.5:
        (h, w) = image_np.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image_np, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return rotated, round(float(angle), 2)

    return image_np, 0.0

def apply_clahe(image_np: np.ndarray) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to balance faded ink, dark stamps, and uneven scan lighting.
    """
    if not HAS_OPENCV:
        return image_np
    if len(image_np.shape) == 3:
        lab = cv2.cvtColor(image_np, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
    else:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(image_np)

def apply_bilateral_denoise(image_np: np.ndarray) -> np.ndarray:
    """
    Applies bilateral filter denoising to eliminate paper grain & noise
    while strictly preserving crisp character edges and Shirorekha lines.
    """
    if not HAS_OPENCV:
        return image_np
    return cv2.bilateralFilter(image_np, d=9, sigmaColor=75, sigmaSpace=75)

def detect_tables_and_lines(image_np: np.ndarray) -> Dict[str, Any]:
    """
    Detects horizontal and vertical cadastral table grid lines (Form 7/12)
    using morphological kernels. Returns line presence and detected cell regions.
    """
    if not HAS_OPENCV:
        return {"has_table": False, "table_cells": [], "table_cells_count": 0}
    
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY) if len(image_np.shape) == 3 else image_np
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    
    h, w = thresh.shape
    # Horizontal lines kernel
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(10, w // 30), 1))
    h_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, h_kernel, iterations=2)
    
    # Vertical lines kernel
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(10, h // 30)))
    v_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, v_kernel, iterations=2)
    
    # Table grid
    table_grid = cv2.add(h_lines, v_lines)
    
    contours, _ = cv2.findContours(table_grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cells = []
    for c in contours:
        x, y, cw, ch = cv2.boundingRect(c)
        if cw > 40 and ch > 15 and cw < w * 0.98 and ch < h * 0.98:
            cells.append({"x": int(x), "y": int(y), "width": int(cw), "height": int(ch)})
    
    return {
        "has_table": len(cells) >= 3,
        "table_cells": cells[:50],
        "table_cells_count": len(cells),
        "h_lines_detected": bool(np.sum(h_lines) > 0),
        "v_lines_detected": bool(np.sum(v_lines) > 0)
    }

def preprocess_document_image(image_bytes: bytes) -> Tuple[Image.Image, Dict[str, Any]]:
    """
    Full 5-stage document preprocessing pipeline:
    1. Load image
    2. Quality estimation
    3. Deskew
    4. CLAHE contrast equalization
    5. Bilateral denoising
    6. Table and line detection
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_np = np.array(pil_img)

    # 1. Quality evaluation
    quality_meta = calculate_image_quality(img_np)

    # 2. Deskew
    deskewed_np, skew_angle = deskew_image(img_np)
    quality_meta["skew_angle_degrees"] = skew_angle

    # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe_np = apply_clahe(deskewed_np)

    # 4. Bilateral Denoising
    denoised_np = apply_bilateral_denoise(clahe_np)

    # 5. Table & line detection
    table_meta = detect_tables_and_lines(denoised_np)
    quality_meta["table_detection"] = table_meta

    processed_pil = Image.fromarray(denoised_np)
    return processed_pil, quality_meta
