import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_scanned_document(
    filepath: str,
    title_hi: str,
    title_en: str,
    fields: list,
    stamp_text: str = "प्रमाणित प्रतिलिपि / CERTIFIED COPY",
    khasra_blur: bool = False
):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    width, height = 1200, 1600
    
    # Base paper color (parchment/aged paper)
    bg_color = (248, 245, 238)
    image = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(image)

    # 1. Subtle paper noise/texture lines
    for _ in range(300):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = x1 + random.randint(-5, 5)
        y2 = y1 + random.randint(-5, 5)
        draw.line([x1, y1, x2, y2], fill=(235, 230, 220), width=1)

    # 2. Border
    draw.rectangle([35, 35, width - 35, height - 35], outline=(60, 60, 60), width=3)
    draw.rectangle([42, 42, width - 42, height - 42], outline=(100, 100, 100), width=1)

    # 3. Government Header
    draw.text((width // 2 - 220, 65), "उत्तर प्रदेश सरकार - राजस्व विभाग", fill=(20, 20, 20))
    draw.text((width // 2 - 260, 95), "GOVERNMENT OF UTTAR PRADESH — REVENUE DEPARTMENT", fill=(40, 40, 40))
    draw.text((width // 2 - 180, 130), title_hi, fill=(10, 10, 10))
    draw.text((width // 2 - 190, 160), f"({title_en})", fill=(50, 50, 50))
    draw.line([60, 200, width - 60, 200], fill=(40, 40, 40), width=2)

    # 4. Official Seal / Circular Stamp
    seal_x, seal_y = width - 220, 100
    draw.ellipse([seal_x, seal_y, seal_x + 130, seal_y + 130], outline=(180, 40, 40), width=3)
    draw.ellipse([seal_x + 10, seal_y + 10, seal_x + 120, seal_y + 120], outline=(180, 40, 40), width=1)
    draw.text((seal_x + 25, seal_y + 45), "राजस्व", fill=(180, 40, 40))
    draw.text((seal_x + 20, seal_y + 70), "SEAL 2026", fill=(180, 40, 40))

    # 5. Tabular Data
    y_cursor = 240
    row_height = 80
    
    # Table Header
    draw.rectangle([60, y_cursor, width - 60, y_cursor + 50], fill=(225, 220, 210), outline=(50, 50, 50), width=2)
    draw.text((80, y_cursor + 15), "विवरण / FIELD NAME", fill=(10, 10, 10))
    draw.text((450, y_cursor + 15), "दर्ज मान / RECORDED VALUE", fill=(10, 10, 10))
    draw.text((850, y_cursor + 15), "टिप्पणी / REMARKS", fill=(10, 10, 10))
    y_cursor += 50

    for label_hi, label_en, val, remark, is_blurry in fields:
        # Alternating background
        row_bg = (252, 250, 246) if (y_cursor // row_height) % 2 == 0 else (245, 242, 235)
        draw.rectangle([60, y_cursor, width - 60, y_cursor + row_height], fill=row_bg, outline=(160, 160, 160), width=1)
        
        # Labels
        draw.text((80, y_cursor + 15), f"{label_hi}", fill=(10, 10, 10))
        draw.text((80, y_cursor + 45), f"({label_en})", fill=(80, 80, 80))
        
        # Value
        draw.text((450, y_cursor + 28), f"{val}", fill=(0, 0, 0))
        
        # Remark
        draw.text((850, y_cursor + 28), f"{remark}", fill=(70, 70, 70))

        y_cursor += row_height

    # 6. Mutation and Endorsement section
    y_cursor += 30
    draw.rectangle([60, y_cursor, width - 60, y_cursor + 150], fill=(250, 247, 240), outline=(80, 80, 80), width=2)
    draw.text((80, y_cursor + 15), "दाखिल-खारिज एवं नामांतरण विवरण / MUTATION RECORD", fill=(10, 10, 10))
    draw.text((80, y_cursor + 50), "आदेश संख्या: ४०९२ दिनांक १४/०३/२०१८ (विरासत आदेशानुसार पारित)", fill=(30, 30, 30))
    draw.text((80, y_cursor + 85), "पंजीकरण कार्यालय: उप-निबंधक सदर, वाराणसी, बही संख्या १, जिल्द ३२४, पृष्ठ १२", fill=(30, 30, 30))
    draw.text((80, y_cursor + 115), "स्थिति: वैध एवं भू-अभिलेख में दर्ज", fill=(20, 120, 40))

    # 7. Signature area
    y_cursor += 180
    draw.text((80, y_cursor + 50), "हस्ताक्षर लेखपाल / PATWARI", fill=(60, 60, 60))
    draw.text((80, y_cursor + 80), "श्री रामेश्वर सिंह (हस्ताक्षरित)", fill=(20, 20, 80))

    draw.text((width - 360, y_cursor + 50), "हस्ताक्षर राजस्व निरीक्षक / TEHSILDAR", fill=(60, 60, 60))
    draw.text((width - 360, y_cursor + 80), "श्री वी. के. शर्मा (तहसीलदार सदर)", fill=(20, 20, 80))

    # 8. Certified Copy diagonal stamp
    stamp_img = Image.new("RGBA", (500, 100), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(stamp_img)
    s_draw.rectangle([5, 5, 495, 95], outline=(180, 30, 30, 180), width=3)
    s_draw.text((40, 35), stamp_text, fill=(180, 30, 30, 200))
    stamp_rot = stamp_img.rotate(15, expand=1)
    image.paste(stamp_rot, (width // 2 - 250, height - 300), stamp_rot)

    # Convert and save
    image.save(filepath, "PNG", quality=95)
    print(f"Generated sample scan: {filepath}")

def generate_all():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    docs_dir = os.path.join(base_dir, "documents")
    
    # Doc 1: Rampur Hero Scan (Contains Khasra 108/102 with realistic handwritten ink mark)
    doc1_fields = [
        ("भूस्वामी का नाम", "Owner Name", "Rajesh Kumar / राजेश कुमार", "खातेदार श्रेणी १", False),
        ("सर्वे क्रमांक", "Survey Number", "12/4A", "वैध सर्वे सीमा", False),
        ("खसरा संख्या", "Khasra Number", "108", "संशोधन योग्य / Verify", True),
        ("खाता संख्या", "Khata Number", "45", "खतौनी खाता", False),
        ("रकबा / क्षेत्रफल", "Plot Area", "2.45 acre", "कृषि योग्य सिंचित", False),
        ("ग्राम का नाम", "Village", "Rampur / रामपुर", "जनगणना कोड: ०९१२०१", False),
        ("तहसील", "Tehsil", "Sadar / सदर", "सदर तहसील", False),
        ("ज़िला", "District", "Varanasi / वाराणसी", "उत्तर प्रदेश", False),
        ("भूमि श्रेणी", "Land Classification", "Agricultural (Irrigated)", "उपजाऊ भूमि", False),
    ]
    create_scanned_document(
        os.path.join(docs_dir, "sample_01.png"),
        "खतौनी (अधिकार अभिलेख) उद्धरण",
        "Record of Rights — Form R-7",
        doc1_fields,
        khasra_blur=True
    )

    # Doc 2: Shivpur Scan
    doc2_fields = [
        ("भूस्वामी का नाम", "Owner Name", "Suresh Chandra Verma", "एकल खातेदार", False),
        ("सर्वे क्रमांक", "Survey Number", "45/2B", "मानचित्र संरेखित", False),
        ("खसरा संख्या", "Khasra Number", "240/1", "प्रमाणित", False),
        ("खाता संख्या", "Khata Number", "78", "खतौनी संख्या", False),
        ("रकबा / क्षेत्रफल", "Plot Area", "1.80 hectare", "सिंचित कृषि", False),
        ("ग्राम का नाम", "Village", "Shivpur", "पिंडरा परगना", False),
        ("तहसील", "Tehsil", "Pindra", "पिंडरा तहसील", False),
        ("ज़िला", "District", "Varanasi", "उत्तर प्रदेश", False),
        ("भूमि श्रेणी", "Land Classification", "Agricultural (Irrigated)", "सामान्य दर", False),
    ]
    create_scanned_document(
        os.path.join(docs_dir, "sample_02.png"),
        "भू-अभिलेख खसरा पत्रक",
        "Khasra Inspection Register",
        doc2_fields
    )

    # Doc 3: Chandpur Scan
    doc3_fields = [
        ("भूस्वामी का नाम", "Owner Name", "Anita Devi", "महिला कृषक", False),
        ("सर्वे क्रमांक", "Survey Number", "88/1", "सीमांकन पूर्ण", False),
        ("खसरा संख्या", "Khasra Number", "315", "सदर परगना", False),
        ("खाता संख्या", "Khata Number", "112", "संयुक्त खाता", False),
        ("रकबा / क्षेत्रफल", "Plot Area", "4.20 bigha", "कछार भूमि", False),
        ("ग्राम का नाम", "Village", "Chandpur", "सदर ब्लॉक", False),
        ("तहसील", "Tehsil", "Sadar", "सदर तहसील", False),
        ("ज़िला", "District", "Varanasi", "उत्तर प्रदेश", False),
        ("भूमि श्रेणी", "Land Classification", "Agricultural (Unirrigated)", "नहर सिंचित", False),
    ]
    create_scanned_document(
        os.path.join(docs_dir, "sample_03.png"),
        "राजस्व नकल खतौनी",
        "Certified Land Revenue Transcript",
        doc3_fields
    )

if __name__ == "__main__":
    generate_all()
