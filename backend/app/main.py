import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
import app.models # Register all models

from app.api.routers import auth, batches, documents, validation, stats, audit_logs, gis, notifications, feedback

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VeriBhoomi AI — Backend API",
    description="Intelligent Land Record Digitization & Validation System API (SIH26018)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure storage directories exist (scans are served strictly through authenticated /api/v1/documents/{id}/scan)
os.makedirs(settings.ORIGINAL_SCANS_DIR, exist_ok=True)
sample_docs_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "sample-data", "documents")
)
os.makedirs(sample_docs_dir, exist_ok=True)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(batches.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(validation.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)
app.include_router(audit_logs.router, prefix=settings.API_V1_STR)
app.include_router(gis.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)

from app.services.supabase_service import supabase_service

@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    supa_info = supabase_service.ping()
    db_mode = "Supabase Cloud (Connected)" if supa_info.get("connected") else "Local Engine"
    return {
        "status": "healthy",
        "service": "VeriBhoomi AI Backend",
        "version": "1.0.0",
        "database": db_mode,
        "supabase": supa_info
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
