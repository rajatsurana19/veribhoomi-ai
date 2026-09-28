# VeriBhoomi AI — n8n Automation Engine

This directory contains the production-ready **n8n automation workflows**, configuration guide, and integration architecture for **VeriBhoomi AI** (Maharashtra 7/12 Land Records Modernization System).

---

## Architecture Overview

```
                                  VeriBhoomi AI
               ┌──────────────────────────────────────────────────┐
               │  FastAPI Backend (Port 8000)                     │
               │  - Document & Batch Processing Pipeline          │
               │  - Cryptographic SHA-256 Audit Trail             │
               │  - Directive & Notification Dispatch Engine      │
               └─────────────────┬────────────────────────────────┘
                                 │
                   HTTP Webhooks │ (Non-blocking Daemon Threads)
                   (/webhook/veribhoomi-events)
                                 ▼
               ┌──────────────────────────────────────────────────┐
               │  n8n Automation Engine (Port 5678)               │
               │  Workflows: Master, Batch Ingest, Daily Digest   │
               └──────┬──────────────────────┬─────────────┬──────┘
                      │                      │             │
                      ▼                      ▼             ▼
             ┌─────────────────┐    ┌─────────────────┐   ┌─────────────────┐
             │  Telegram Bot   │    │  Google Sheets  │   │  SMTP / Email   │
             │  - Officer Alert│    │  - Audit Ledger │   │  - Collector    │
             │  - Operator Grp │    │  - Google Drive │   │    Executive    │
             │  - Redo Notices │    │    PDF Archive  │   │    Briefings    │
             └─────────────────┘    └─────────────────┘   └─────────────────┘
```

---

## Available Workflows

| File | Purpose | Trigger | Integrations |
|---|---|---|---|
| **`workflows/veribhoomi_master_workflow.json`** | Real-time event orchestrator for approvals, rejections, redo notices, and operator reverts. | Webhook `POST /webhook/veribhoomi-events` | Telegram, Email (SMTP), Google Sheets, Google Drive |
| **`workflows/veribhoomi_batch_ingestion_workflow.json`** | Automated folder watch: Ingests incoming 7/12 PDFs into VeriBhoomi via REST API. | Schedule (15m) / Google Drive Watcher | Google Drive, VeriBhoomi API (`/batches`, `/documents`), Telegram |
| **`workflows/veribhoomi_collector_digest_workflow.json`** | Executive revenue telemetry, SLA compliance tracking, and revenue circle throughput report. | Cron: Daily at 09:00 AM IST (`0 9 * * *`) | VeriBhoomi Stats API, Telegram, Email |

---

## 1. Quick Start with Docker Compose

n8n is bundled directly in the VeriBhoomi root `docker-compose.yml`:

```bash
# Start n8n service
docker-compose up -d n8n
```

Once started, open your browser:
- **URL**: `http://localhost:5678`
- Set up your owner account on first launch.

---

## 2. Importing Workflows into n8n

1. In the n8n UI, navigate to **Workflows** $\rightarrow$ click **Add Workflow** (or `+`).
2. Click the top-right **"..."** menu $\rightarrow$ **Import from File**.
3. Select one of the JSON files from `n8n/workflows/`:
   - `veribhoomi_master_workflow.json`
   - `veribhoomi_batch_ingestion_workflow.json`
   - `veribhoomi_collector_digest_workflow.json`
4. Click **Save** and toggle the workflow from **Inactive** to **Active**.

---

## 3. Configuring Credentials & Environment Variables

### A. Telegram Bot (Instant Alerts & Staff Directives)
1. Message `@BotFather` on Telegram to create a bot (e.g. `@VeriBhoomiBot`) and get your **Bot Token**.
2. Add the bot to your:
   - **Officers Channel / Group**: Get the `TELEGRAM_OFFICER_CHAT_ID`
   - **Operators Channel / Group**: Get the `TELEGRAM_OPERATOR_CHAT_ID`
   - **District Collector Channel**: Get the `TELEGRAM_COLLECTOR_CHAT_ID`
3. In n8n, go to **Credentials** $\rightarrow$ **New Credential** $\rightarrow$ **Telegram API** and paste your Bot Token.

### B. Google Workspace (Sheets Audit Ledger & Drive PDF Backup)
1. In Google Cloud Console, enable **Google Drive API** and **Google Sheets API**.
2. Create an **OAuth2 Client ID** or **Service Account**.
3. In n8n, create credentials for **Google Sheets OAuth2 API** and **Google Drive OAuth2 API**.
4. Set the spreadsheet ID where approved 7/12 records should append rows:
   - Header Columns: `Timestamp | Document ID | Survey No | Village | Taluka | District | Area | Khatedar | State LRMS ID | Approving Officer`

### C. SMTP / Email Configuration
In n8n, create credentials for **SMTP**:
- Host: `smtp.gmail.com` (or government NIC SMTP server)
- Port: `465` (SSL) or `587` (TLS)
- User / App Password: `<your-email-address>`

---

## 4. VeriBhoomi Backend Webhook Configuration

Ensure your `backend/.env` (or `docker-compose.yml`) has webhooks enabled:

```env
ENABLE_N8N_WEBHOOKS=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook/veribhoomi-events
```

*(If running inside Docker Compose, use `http://n8n:5678/webhook/veribhoomi-events`)*

### Supported Webhook Events
Whenever revenue staff take actions in VeriBhoomi, the backend emits non-blocking JSON payloads:

| Event Type | Trigger Point in VeriBhoomi | Action in n8n |
|---|---|---|
| `DOCUMENT_APPROVED` | Tehsildar clicks *"Differences & Approve"* | Appends row to Google Sheets, archives PDF in Drive, alerts Telegram channel & sends email notice. |
| `DOCUMENT_REJECTED` | Officer rejects document with reason | Alerts Operator Telegram group with flagged fields and fix link. |
| `DOCUMENT_SUBMITTED` | Operator submits digitized 7/12 | Alerts Officer queue that record is ready for review. |
| `NOTIFICATION_DISPATCHED` | Admin/Officer sends Redo Directive | High-priority Telegram alert to operators with instructions. |
| `OPERATOR_REVERTED` | Operator clicks *"Revert / Reply"* | Alerts Officer that correction has been applied and re-submitted. |

---

## 5. Testing the Pipeline

A verification script is provided in `backend/scripts/test_n8n_webhook.py`:

```bash
python backend/scripts/test_n8n_webhook.py
```

This simulates live VeriBhoomi events (Approval, Rejection, Redo Directive, and Operator Revert) against your webhook listener to verify end-to-end delivery.
