import os
import sys
import io
from typing import Dict, Any, Tuple
from PIL import Image

try:
    import pymupdf
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pytesseract
    HAS_TESSERACT = True
    possible_tess_bins = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "tesseract", "tesseract.exe")),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        "tesseract"
    ]
    for tb in possible_tess_bins:
        if os.path.exists(tb) or tb == "tesseract":
            pytesseract.pytesseract.tesseract_cmd = tb
            break
            
    possible_tessdata = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "tesseract", "tessdata")),
        r"C:\Program Files\Tesseract-OCR\tessdata"
    ]
    for td in possible_tessdata:
        if os.path.exists(td):
            os.environ["TESSDATA_PREFIX"] = td
            break
except ImportError:
    HAS_TESSERACT = False

def extract_pdf_content(pdf_path: str) -> Tuple[str, Image.Image, Dict[str, Any]]:
    """
    Extracts complete text and representative primary page image from a PDF.
    Combines digital vector text extraction with Tesseract OCR of embedded scans and rendered pages.
    """
    if not HAS_PYMUPDF:
        raise RuntimeError("PyMuPDF is not installed. Run: pip install pymupdf")

    doc = pymupdf.open(pdf_path)
    full_text_parts = []
    
    # 1. Digital text
    raw_digital = ""
    for page in doc:
        raw_digital += page.get_text() + "\n"
    
    is_garbled = "ƻǗ" in raw_digital or "ǃƥ" in raw_digital
    has_valid_digital = len(raw_digital.strip()) > 150 and not is_garbled
    
    if has_valid_digital:
        full_text_parts.append(raw_digital)

    # 2. Render first page for pipeline layout
    page0 = doc[0]
    pix = page0.get_pixmap(dpi=150)
    primary_pil = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    # 3. Check for high-res embedded scans
    has_embedded_scans = False
    if HAS_TESSERACT:
        for pno, page in enumerate(doc):
            images = page.get_images()
            for img_info in images:
                xref = img_info[0]
                bimg = doc.extract_image(xref)
                if bimg["width"] >= 500 and bimg["height"] >= 400:
                    has_embedded_scans = True
                    emb_img = Image.open(io.BytesIO(bimg["image"]))
                    if pno == 0 and bimg["width"] > 800:
                        primary_pil = emb_img
                    try:
                        ocr_text = pytesseract.image_to_string(emb_img, lang="mar+hin+eng")
                        full_text_parts.append(ocr_text)
                    except Exception as e:
                        print(f"Warning: OCR failed on embedded image {xref}: {e}", file=sys.stderr)

        # If no valid digital text and no embedded scan image, OCR rendered page
        if not has_valid_digital and not has_embedded_scans:
            for page in doc:
                p_pix = page.get_pixmap(dpi=150)
                rendered_img = Image.frombytes("RGB", [p_pix.width, p_pix.height], p_pix.samples)
                try:
                    ocr_text = pytesseract.image_to_string(rendered_img, lang="mar+hin+eng")
                    full_text_parts.append(ocr_text)
                except Exception as e:
                    print(f"Warning: OCR failed on rendered page: {e}", file=sys.stderr)

        # Garbled fonts
        if is_garbled:
            for page in doc:
                p_pix = page.get_pixmap(dpi=150)
                rendered_img = Image.frombytes("RGB", [p_pix.width, p_pix.height], p_pix.samples)
                try:
                    ocr_text = pytesseract.image_to_string(rendered_img, lang="mar+hin+eng")
                    full_text_parts.append(ocr_text)
                except Exception as e:
                    print(f"Warning: OCR failed on garbled page render: {e}", file=sys.stderr)

    combined_text = "\n".join(full_text_parts)
    meta = {
        "pages": len(doc),
        "has_digital_text": has_valid_digital,
        "is_garbled_font": is_garbled,
        "embedded_scans_detected": has_embedded_scans,
        "total_chars": len(combined_text)
    }
    return combined_text, primary_pil, meta
