# VeriBhoomi AI (वेरीभूमि AI) — Comprehensive System Architecture, Data Flow & Technical Reference Guide
**Ministry of Rural Development — Smart Cadastral Digitization, Validation & Management Platform**
*Specialized Focus: Maharashtra 7/12 Land Records (सातबारा), Extensible Pan-India Architecture*
*Document Version: 3.0.0-Enterprise | Production Certified*

---

## 1. Executive Summary & Maharashtra 7/12 Revenue Context

**VeriBhoomi AI** is a mission-critical government back-office platform designed for state revenue administration (Talathi / Revenue Operators, Circle Officers / Tehsildars, and Sub-Divisional Magistrates / District Collectors).

The system automates the ingestion, deskewing, quality enhancement, bilingual OCR extraction, deterministic validation, visual diff verification, and cryptographic audit-chaining of scanned cadastral records before records are committed to state Land Record Management Systems (e-MahaBhumi / DILRMP / LRMS).

### Primary Revenue Document: Maharashtra Form 7/12 (सातबारा उतारा)
- **Village Form VII (गाव नमुना ७)**: Rights of occupants (भोगवटादार), Survey/Gat numbers (सर्वे / गट क्रमांक), Sub-divisions (पोट हिस्सा), Khata numbers (खाते क्रमांक), and Tenure class (भोगवटादार वर्ग १ / २).
- **Village Form XII (गाव नमुना १२)**: Crops and agricultural register (पिकांची नोंदवही), Cultivable area (लागवडीयोग्य क्षेत्र), Pot-Kharab (पडीक क्षेत्र), Irrigation mode (बागायत / जिरायत), and Crop season (खरीप / रब्बी).
- **Mutation Register (गाव नमुना ६ / फेरफार नोंद)**: Historical and pending transfers, heirships (वारस नोंद), sales (विक्री), and encumbrances (बोजा).

---

## 2. End-to-End Data Flow Architecture

The data flow diagram below traces the path of a land record scan from physical scan upload to background computer vision processing, duplicate detection, validation, officer verification, and immutable ledger storage:

```mermaid
flowchart TD
    Scan["Scanned 7/12 Land Record (PDF/PNG/TIFF)"] -->|Instant Non-Blocking Upload| BatchWorker["FastAPI Document Orchestrator (Port 8000)"]
    BatchWorker -->|AES-256 Encryption at Rest| EncryptedStore["Encrypted Scan Storage & DB"]
    BatchWorker -->|Background Task Trigger| MLPipeline["ML Vision Microservice (Port 8001)"]
    
    subgraph ML_CV_Stage ["Computer Vision & Multimodal Extraction Pipeline"]
        MLPipeline --> Deskew["1. Deskew (minAreaRect & Affine Warping)"]
        Deskew --> CLAHE["2. CLAHE (Adaptive Histogram Equalization)"]
        CLAHE --> Denoise["3. Bilateral Filter Denoising"]
        Denoise --> TableDet["4. Table & Line Morphological Detection"]
        TableDet --> DualOCR{"Modality Routing"}
        DualOCR -->|Printed & Tabular| PaddleTess["PaddleOCR (RapidOCR) + Tesseract (mar+hin+eng)"]
        DualOCR -->|Handwritten Notes| TrOCREngine["Marathi Devanagari Handwritten OCR Engine"]
        PaddleTess --> FieldNorm["Canonical 10-Field Normalizer"]
        TrOCREngine --> FieldNorm
        FieldNorm --> AgriClass["Agri vs Non-Agri Classifier (Marathi Term Analyzer)"]
    end

    AgriClass --> DupCheck{"DB Duplicate Checker"}
    DupCheck -->|Survey/Village Match Exists| FlagDup["Flag as Duplicate & Link Previous ID"]
    DupCheck -->|Unique New Record| GenConf["Compute Accuracy & Validation Rules"]
    FlagDup --> GenConf

    GenConf --> AuditGen["SHA-256 Cryptographic Block Generation"]
    AuditGen --> DBCommit["PostgreSQL / Supabase / SQLite Persistence"]
    
    DBCommit --> OpUI["Operator Dashboard (Real-time Progress)"]
    OpUI --> OffQueue["Officer Verification Queue (Errors Displayed First)"]
    OffQueue --> OffAction{"Officer Review Decision"}
    
    OffAction -->|Differences & Approve| PushLRMS["State e-MahaBhumi / LRMS Push Adapter"]
    OffAction -->|Add Difference / Edit| OfficerLog["Officer Field Edit -> Logged to Audit Trail"]
    OffAction -->|Redo Request| NotifWorkflow["Hierarchical Notification -> Operator Redo Loop"]
    
    OfficerLog --> PushLRMS
    PushLRMS --> SyncDone["Committed to Official Cadastral Ledger"]
```

---

## 3. High-Level System Architecture & Component Diagram

VeriBhoomi AI is architected as an enterprise, loosely coupled microservices topology with strict zero-trust principles:

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (React 18 + TypeScript + Tailwind CSS)"]
        UI_Op["Operator Workspace (Non-blocking Upload & Field Corrections)"]
        UI_Off["Officer Review Queue (Errors-First, Difference & Approve, Edit Difference)"]
        UI_Adm["Admin Portal (District Overview, Maharashtra GIS Heatmap, Audit Explorer)"]
        UI_Notif["Notification Center (Admin -> Officer -> Operator Hierarchical Redo Loop)"]
    end

    subgraph GatewayCore ["FastAPI Backend Core Layer (Port 8000)"]
        AuthModule["OAuth2 / JWT Security & Role Guards (Admin / Officer / Operator)"]
        DocOrchestrator["Batch & Document Orchestrator (Async Background Tasks)"]
        CryptoEngine["Cryptographic Service (AES-256 Storage & Field Encryption)"]
        ValidationEngine["Deterministic 7-Point Cadastral Rule Engine"]
        DupEngine["Survey & Khasra Duplicate Detection Engine"]
        AuditLedgerEngine["SHA-256 Sequential Hash-Chained Audit Ledger"]
        GisService["Cadastral GIS Engine (Coverage Heatmap & Spatial Queries)"]
        NotifService["Hierarchical Notification Service"]
    end

    subgraph MLMicroservice ["ML Vision Microservice (Port 8001)"]
        CV_Preproc["OpenCV Deskew, CLAHE & Bilateral Denoising"]
        Layout_Engine["Morphological Grid & Table Line Detection"]
        PaddleOCR_Engine["PaddleOCR (RapidOCR ONNX Runtime - Devanagari)"]
        Tess_Engine["Tesseract OCR (mar+hin+eng Trilingual)"]
        HW_Engine["Marathi Handwritten Recognition Engine"]
        Classifier_Engine["Agricultural vs Non-Agricultural Marathi Classifier"]
    end

    subgraph PersistenceLayer ["Enterprise Persistence Layer"]
        SupabaseDB["Supabase Hosted PostgreSQL + PostGIS (Port 6543 / 5432)"]
        SQLiteFallback["Local SQLite Development & Isolated Test Fallback"]
        EncryptedStorage["Encrypted File Vault (Scans & Extracted Blobs)"]
    end

    subgraph ExternalIntegrations ["External Interfaces"]
        MahaBhumiLRMS["State e-MahaBhumi / LRMS Mock Gateway (Port 8002)"]
        N8NWebhooks["n8n Webhook Alerts & Dispatcher (Port 5678)"]
    end

    ClientLayer <-->|REST API + JWT Bearer| GatewayCore
    GatewayCore -->|HTTP POST JSON / Multipart| MLMicroservice
    GatewayCore --> CryptoEngine
    CryptoEngine --> EncryptedStorage
    GatewayCore <-->|SQLAlchemy ORM + PostGIS| SupabaseDB
    GatewayCore -.->|Offline Fallback| SQLiteFallback
    GatewayCore --> MahaBhumiLRMS
    GatewayCore --> N8NWebhooks
```

---

## 4. Complete Lifecycle Process Flowchart

```mermaid
flowchart TD
    Start([Operator Initiates Upload]) --> SelectFiles[/Select Scanned 7/12 Records/]
    SelectFiles --> ClickUpload[Operator Clicks Upload & Push]
    ClickUpload --> NonBlocking[Immediate 201 Response & Instant Toast]
    NonBlocking --> RedirectOp[Redirect to Operator Dashboard]
    
    subgraph BackgroundJob ["Asynchronous Background Worker"]
        EncryptFile[Encrypt Scan File with AES-256] --> StoreEncrypted[Store in Secure Vault]
        StoreEncrypted --> OpenCVPrep[Deskew -> CLAHE -> Bilateral Denoising]
        OpenCVPrep --> DetectTables[Detect Cadastral Table Grid & Lines]
        DetectTables --> RunOCR[Run PaddleOCR + Tesseract mar+hin+eng]
        RunOCR --> Extract10Fields[Extract 10 Canonical Fields]
        Extract10Fields --> AutoExtractLoc[Auto-extract District, Tehsil, Village & Area]
        AutoExtractLoc --> ClassifyAgri{Analyze Marathi Keywords}
        ClassifyAgri -->|'शेती', 'जिरायत', 'बागायत'| SetAgri[Class: Agricultural]
        ClassifyAgri -->|'अकृषिक', 'N.A.', 'निवासी'| SetNonAgri[Class: Non-Agricultural]
        SetAgri --> CheckDBDup{Survey No + Village in DB?}
        SetNonAgri --> CheckDBDup
        CheckDBDup -->|Yes| MarkDuplicate[Set is_duplicate = True & Reference Existing Doc]
        CheckDBDup -->|No| CalcAccuracy[Calculate Accuracy Rating & Run Rules]
        MarkDuplicate --> CalcAccuracy
        CalcAccuracy --> AppendGenesis[Compute SHA-256 Block & Append to Ledger]
    end

    AppendGenesis --> UpdateStatus[Update Document Status to 'needs_review' or 'reviewed']
    UpdateStatus --> OfficerQueueView[/Officer Opens Queue/]
    
    OfficerQueueView --> CheckErrors{Are There Errors or Duplicate Flags?}
    CheckErrors -->|Yes| DisplayErrorsTop[Display Errors & Duplicate Banner at TOP]
    CheckErrors -->|No| DisplayNormal[Display Standard Diff View]
    
    DisplayErrorsTop --> OfficerReview[Officer Evaluates Document]
    DisplayNormal --> OfficerReview
    
    OfficerReview --> DecisionChoice{Officer Action}
    DecisionChoice -->|Add Difference / Edit| EditModal[Officer Edits Value]
    EditModal --> LogOfficerEdit[Log to Audit Ledger with Date & Time]
    LogOfficerEdit --> OfficerReview
    
    DecisionChoice -->|Differences & Approve| ApproveCommit[Approve & Push to e-MahaBhumi LRMS]
    ApproveCommit --> AppendApproveAudit[Append Approval Block to SHA-256 Ledger]
    AppendApproveAudit --> EndSuccess([Finalized in Official Cadastre])

    DecisionChoice -->|Redo Required| SendRedoNotif[Send Redo Notification to Operator]
    SendRedoNotif --> OpReceivesNotif[Operator Receives Redo Alert]
    OpReceivesNotif --> OpReverts[Operator Corrects & Reverts with Note]
    OpReverts --> NotifOfficer[Officer Notified of Resubmission]
    NotifOfficer --> OfficerQueueView
```

---

## 5. Sequence Diagram: Multi-Role Workflow & Asynchronous Execution

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Revenue Operator (Talathi)
    actor Officer as Approving Officer (Tehsildar)
    actor Admin as District Admin (Collector)
    participant API as FastAPI Backend (8000)
    participant ML as ML Service (PaddleOCR + Tesseract) (8001)
    participant DB as Supabase / PostGIS
    participant LRMS as State e-MahaBhumi Gateway (8002)

    Operator->>API: POST /batches/{id}/documents (Files Uploaded)
    API-->>Operator: 201 Created (Instant: Non-blocking; background task spawned)
    Note over Operator: Operator redirected to Dashboard; sees live progress

    API->>API: Encrypt Scan at Rest (AES-256)
    API->>ML: POST /extract (Scan bytes, metadata)
    ML->>ML: Deskew -> CLAHE -> Bilateral Denoising
    ML->>ML: Morphological Line & Table Grid Detection
    ML->>ML: PaddleOCR + Tesseract mar+hin+eng
    ML->>ML: Classify: Agricultural / Non-Agricultural
    ML-->>API: Extracted 10 Canonical Fields + Accuracy Rating
    
    API->>DB: Check for Existing Duplicate (Survey No + Village)
    alt Duplicate Found
        API->>DB: Set is_duplicate=True, duplicate_of_id=doc_123
    end
    API->>DB: Persist Fields, Quality, Accuracy & Append SHA-256 Audit Block

    Officer->>API: GET /officer/documents/{id}
    API-->>Officer: Document Data with Errors & Duplicate Flags FIRST
    
    alt Officer identifies discrepancy
        Officer->>API: PATCH /documents/{id}/officer-edit (Field: plot_area, New Value: 0.85)
        API->>DB: Update Value & Record OFFICER_CORRECTION with Full Date & Time in Audit Ledger
    end

    alt Officer determines document must be redone
        Officer->>API: POST /notifications/send (Recipient: Operator, Reason: "Blurry mutation stamp")
        API->>DB: Create Notification (type: redo_request)
        API-->>Operator: Notification Alert Banner displayed
        Operator->>API: POST /notifications/{id}/revert (Reply: "Rescanned at 300 DPI, updated")
        API-->>Officer: Notification Alert: Reverted & Resubmitted
    end

    Officer->>API: POST /documents/{id}/approve (Differences & Approve)
    API->>LRMS: Push Finalized Payload to e-MahaBhumi Gateway
    LRMS-->>API: 200 OK (External LRMS ID: MH-2026-004581)
    API->>DB: Set status: pushed_to_lrms & Append Final Audit Block
    API-->>Officer: Approval & LRMS Synchronization Success Modal
```

---

## 6. Detailed Computer Vision & Multi-Engine OCR Architecture

### 6.1 Four-Stage Preprocessing Pipeline
1. **Deskewing ($\theta \in [-20^\circ, 20^\circ]$)**:
   - Thresholding via Otsu binarization.
   - Contour extraction of bounding boxes with `cv2.minAreaRect`.
   - Affine bicubic rotation matrix:
     $$\mathbf{M} = \begin{bmatrix} \cos\theta & -\sin\theta & (1-\cos\theta)x_c + \sin\theta y_c \\ \sin\theta & \cos\theta & -\sin\theta x_c + (1-\cos\theta)y_c \end{bmatrix}$$
2. **CLAHE (Contrast Limited Adaptive Histogram Equalization)**:
   - Eliminates uneven illumination, shadows, and low-contrast revenue stamps:
     $$\text{CLAHE}(I) \implies \text{clipLimit}=2.0, \quad \text{tileGridSize}=(8, 8)$$
3. **Bilateral Denoising**:
   - Smooths paper grain and background noise while strictly preserving sharp Devanagari character edges and Shirorekha lines:
     $$I^{\text{filtered}}(x) = \frac{1}{W_p} \sum_{x_i \in \Omega} I(x_i) f_r(\|I(x_i) - I(x)\|) g_s(\|x_i - x\|)$$
     with parameters $d=9$, $\sigma_{\text{color}}=75$, $\sigma_{\text{space}}=75$.
4. **Table & Line Detection (Morphological Operations)**:
   - Horizontal kernel: $\mathbf{K}_h = \text{rect}(W/30, 1)$
   - Vertical kernel: $\mathbf{K}_v = \text{rect}(1, H/30)$
   - Line intersection mask: $\mathbf{M}_{\text{grid}} = (\mathbf{I} \circ \mathbf{K}_h) \cap (\mathbf{I} \circ \mathbf{K}_v)$
   - Isolates the exact tabular cells for: (1) भू-धारणा पद्धती / वर्ग, (2) खाते क्रमांक, (3) भूमापन / गट क्रमांक, (4) क्षेत्रफळ, (5) खातेदाराचे नाव, and (6) फेरफार नोंदी.

### 6.2 Dual-Engine OCR Fusion (PaddleOCR + Tesseract mar+hin+eng)
- **PaddleOCR (RapidOCR ONNX Runtime)**:
  - Text detection: DBNet with ResNet50 backbone.
  - Text recognition: SVTR / CRNN optimized for complex Devanagari ligatures and Marathi conjunct characters (जोडाक्षरे जसे की क्ष, ज्ञ, त्र, श्र).
- **Tesseract 5.4.1 (Bilingual Devanagari + English)**:
  - LSTM engine loaded with `mar.traineddata`, `hin.traineddata`, and `eng.traineddata`.
- **Fusion Logic**:
  - Reconciles bounding box tokens between both engines.
  - Computes word-level agreement:
    $$\text{Token Agreement} = \text{LevenshteinSimilarity}(T_{\text{Paddle}}, T_{\text{Tesseract}})$$
  - Selects the candidate with higher confidence logit score or gazetteer agreement.

### 6.3 Marathi Handwritten Recognition Engine
- Specifically tunes recognition for cursive Marathi handwritten annotations in the mutation column (इतर हक्क व फेरफार नोंदी):
  - Identifies handwritten Devanagari numerals (०, १, २, ३, ४, ५, ६, ७, ८, ९).
  - Recognizes standard revenue mutation terms: "वारस नोंद", "विक्री करार", "बक्षीस पत्र", "बँक बोजा", "गहाण खत", "हक्क सोड पत्र".

---

## 7. Agricultural vs Non-Agricultural Classification Engine

Maharashtra 7/12 land records are legally partitioned into Agricultural (शेती जमीन) and Non-Agricultural (अकृषिक / N.A. जमीन). The system classifies documents based on semantic keyword frequency and revenue attributes:

```mermaid
flowchart TD
    RawText[Extracted Marathi Full Text] --> ScanKeywords[Scan Domain Vocabulary]
    
    subgraph AgriVocabulary ["Agricultural Lexicon (शेती निर्देशक शब्द)"]
        A1["शेती / शेताचे / शेतीचे"]
        A2["जिरायत (Dry Crop)"]
        A3["बागायत (Irrigated)"]
        A4["पडीक / पोटखराब (Uncultivable)"]
        A5["भातशेती (Paddy) / बागाईत"]
        A6["खरीप / रब्बी हंगाम (Crop Seasons)"]
        A7["पिकांची नोंदवही (Crop Register Form 12)"]
    end

    subgraph NonAgriVocabulary ["Non-Agricultural Lexicon (अकृषिक निर्देशक शब्द)"]
        NA1["अकृषिक / अ.क्र. / N.A."]
        NA2["बिगरशेती / अकृषक आकारणी"]
        NA3["वाणिज्यिक (Commercial)"]
        NA4["निवासी (Residential)"]
        NA5["औद्योगिक (Industrial)"]
        NA6["नगर भूमापन हद्दीत वर्ग (CTS / Property Card)"]
        NA7["हा ७/१२ बंद झाला आहे (Record Closed / Converted)"]
    end

    ScanKeywords --> CountMatches[Calculate Weighted Match Scores: S_agri & S_non_agri]
    CountMatches --> Decision{S_agri >= S_non_agri ?}
    Decision -->|Yes| SetAgriDoc["Classification: Agricultural (शेती)"]
    Decision -->|No| SetNonAgriDoc["Classification: Non-Agricultural (अकृषिक / N.A.)"]
    
    SetAgriDoc --> FilterAdmin["Expose in Admin Filter & Analytics Breakdown"]
    SetNonAgriDoc --> FilterAdmin
```

---

## 8. Cryptographic Security Architecture: AES-256 Storage & SHA-256 Audit Chain

To ensure zero-trust compliance, strict confidentiality, and evidentiary admissibility (Section 65B of the Indian Evidence Act):

```mermaid
graph LR
    subgraph StorageCrypto ["Confidentiality at Rest (AES-256-CBC / Fernet)"]
        RawScan["Original Scanned 7/12"] -->|Symmetric AES-256 Key| CipherBytes["Encrypted Scan Blob (.enc)"]
        CipherBytes --> Disk["Secure Storage Vault"]
        Disk -->|Authenticated User Request| Decrypt["Transparent Decryption Stream"]
        Decrypt --> SecureViewer["55/45 Split Viewer"]
    end

    subgraph IntegrityCrypto ["Non-Repudiation & Tamper Proof Audit Ledger"]
        Genesis["Genesis Block #1\nHash: 00000a..."] --> Block2["Block #2: Doc Upload\nPrev: 00000a..."]
        Block2 --> Block3["Block #3: Field Correction\nPrev: Hash(#2)..."]
        Block3 --> Block4["Block #4: Officer Edit\nPrev: Hash(#3)..."]
        Block4 --> BlockHead["Block #N: Approved & LRMS Sync\nPrev: Hash(#N-1)..."]
    end
```

### Cryptographic Hash Computation
$$\text{Entry Hash}_i = \text{SHA256}\Big(\text{CanonicalJSON}(id, action, doc\_id, user\_email, role, field, old\_val, new\_val, \text{ISO\_datetime}) \;\|\; \text{Entry Hash}_{i-1}\Big)$$

---

## 9. Cadastral PostGIS Architecture & Maharashtra Coverage Heatmap

```mermaid
flowchart TD
    subgraph GeoJSONLayer ["Maharashtra Cadastral GIS (Admin Map)"]
        CenterMap["Map Centered: Maharashtra (19.0760 N, 72.8777 E)"]
        Boundaries["Real Village Boundary Polygons (Kalote Rayati, Posari, Andheri, Oshiwara, Kurla, Kirol)"]
        CenterMap --> Boundaries
        
        Boundaries --> ToggleMode{"View Mode Toggle"}
        ToggleMode -->|Boundary Mode| PolygonStyle["Color Coded by Digitization Status (Green / Amber / Blue)"]
        ToggleMode -->|Heatmap Mode| HeatmapOverlay["Coverage Density Heatmap (Intensity = Docs Digitized / Target)"]
    end

    subgraph DynamicMetrics ["Live Village Metrics Calculation"]
        HeatmapOverlay --> CoverageCalc["Coverage Ratio = Processed Documents / Total Plots"]
        CoverageCalc --> HighCoverage["High Coverage Areas (Digitized >= 80% - Green/Hot)"]
        CoverageCalc --> LowCoverage["Remaining Areas Left (Digitized < 30% - Red/Cold)"]
    end
```

---

## 10. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ BATCHES : creates
    USERS ||--o{ DOCUMENTS : reviews_or_approves
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ NOTIFICATIONS : receives_or_sends
    
    BATCHES ||--o{ DOCUMENTS : contains
    BATCHES ||--o{ NOTIFICATIONS : related_to

    DOCUMENTS ||--o{ EXTRACTED_FIELDS : has
    DOCUMENTS ||--o{ VALIDATION_RESULTS : evaluated_by
    DOCUMENTS ||--o{ AUDIT_LOGS : tracks
    DOCUMENTS ||--o{ LRMS_PUSH_LOGS : synced_via
    DOCUMENTS ||--o{ NOTIFICATIONS : references

    USERS {
        string id PK
        string email
        string full_name
        string role "operator | officer | admin"
        string department
        string designation
    }

    BATCHES {
        string id PK
        string name
        string state
        string district
        string tehsil
        string village
        string status
        int total_documents
        string created_by FK
        datetime created_at
    }

    DOCUMENTS {
        string id PK
        string batch_id FK
        string filename
        string storage_path
        string original_scan_url
        string status "queued | processing | needs_review | reviewed | approved | rejected | pushed_to_lrms"
        float overall_confidence
        boolean is_duplicate
        string duplicate_of_id
        string land_type "Agricultural | Non-Agricultural"
        boolean is_encrypted
        string reviewed_by FK
        datetime reviewed_at
        string approved_by FK
        datetime approved_at
        string rejection_reason
        string external_lrms_id
        datetime created_at
        datetime updated_at
    }

    EXTRACTED_FIELDS {
        string id PK
        string document_id FK
        string field_name "owner_name | survey_number | khasra_number | khata_number | plot_area | village | tehsil | district | land_classification | mutation_details"
        string value
        string ai_value
        float confidence
        string source "auto | corrected | officer_edit"
        string engine
        string modality "printed | handwritten"
    }

    AUDIT_LOGS {
        string id PK
        int sequence_number
        string action "DOCUMENT_UPLOADED | FIELD_CORRECTED | OFFICER_EDIT | APPROVED | REJECTED | PUSHED_TO_LRMS"
        string document_id FK
        string user_id FK
        string user_email
        string role
        string field_name
        string old_value
        string new_value
        string block_hash
        string previous_hash
        datetime timestamp
    }

    NOTIFICATIONS {
        string id PK
        string user_id FK
        string batch_id FK
        string document_id FK
        string sender_id FK
        string sender_role "admin | officer | operator"
        string title
        string message
        string type "redo_request | revert_reply | info | warning"
        string parent_notification_id
        boolean is_read
        datetime created_at
    }

    MASTER_REFERENCE {
        string id PK
        string state
        string district
        string tehsil
        string village
        string census_code
        geometry geom "PostGIS Polygon EPSG:4326"
    }
```

---

## 11. Technical Summary of Enhancements

| Component | Legacy State | Enhanced Production State (v3.0.0) |
| :--- | :--- | :--- |
| **Cadastral GIS Focus** | Mock UP/Varanasi & MP/Indore data | **Authentic Maharashtra 7/12 Focus** (`Raigad` & `Mumbai Suburban` villages); real GeoJSON boundaries. |
| **GIS Visualization** | Static polygon borders | **Interactive Coverage Heatmap Toggle** showing heavily covered areas vs areas remaining to be digitized. |
| **Officer Review Queue** | Validation checklist at bottom; hidden scrollbars | **Errors & Duplicate Alerts Displayed FIRST at Top**; fully visible, styled scrollbars; clean layouts. |
| **Officer Action** | Approve or Reject only; fields read-only | **"Differences & Approve"** + **"Add Difference / Officer Edit"** with full SHA-256 audit logging. |
| **Audit Trail Format** | Time only (`10:45 AM`) | **Full Date & Time (`23/09/2026, 10:45:12 AM`)** for evidentiary integrity. |
| **Location Attributes** | Relied on operator manual form entry | **Automatically extracted from Document Content** (District, Tehsil, Village, Area) via OCR. |
| **Terminology & Jargon** | Technical terms ("AI Confidence", "AI Draft", "Dual-Pass") | **Layman-Friendly Revenue Terms** ("Accuracy Rating", "Extracted Data", "Automated Verification"). |
| **Sidebar Metrics** | Hardcoded `3` and `3` samples | **Dynamic Real-Time Stats** connected to live database audit records & encrypted storage status. |
| **Filter Capabilities** | Basic text search | **Multi-Criteria Filter**: Date & Time Range, Area (District/Village), Action, Land Classification. |
| **Notifications** | Read-only static notices | **Hierarchical Redo Loop**: Admin $\to$ Officer $\to$ Operator ("Redo this batch") and Operator Revert/Reply. |
| **Storage Security** | Plaintext files on disk | **AES-256 Symmetric Encryption at Rest** for scans and sensitive citizen attributes. |
| **Batch Upload UX** | Blocking loading screen | **Instant Asynchronous Push**; immediate toast and redirect to Operator Dashboard with background progress. |
| **OCR Vision Pipeline** | Standard Tesseract only | **Deskew + CLAHE + Bilateral Denoising + Table/Line Detection + PaddleOCR + Tesseract + Marathi Handwritten**. |
| **Classification** | Unclassified | **Semantic Marathi Agricultural vs Non-Agricultural Classifier** (`शेती` vs `अकृषिक / N.A.`). |
| **Duplicate Prevention** | None at upload gate | **Database Pre-Check**: Flags matching survey/village records and allows structured record update. |
