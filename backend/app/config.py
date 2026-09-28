import os
from pydantic_settings import BaseSettings
from typing import List, Union, Any
from pydantic import field_validator

_DEFAULT_DATABASE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "veribhoomi.db")
).replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "VeriBhoomi AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "veribhoomi-super-secret-jwt-key-2026-sih")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for demo

    # Database: Supports PostgreSQL (with PostGIS) or SQLite local fallback
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{_DEFAULT_DATABASE_PATH}"
    )
    # Direct session connection string for DDL migrations / PostGIS setup (Supabase Port 5432)
    DATABASE_URL_MIGRATIONS: str = os.getenv("DATABASE_URL_MIGRATIONS", "")
    # Explicit flag gating SQLite fallback. In production/demo, must be explicitly true to permit SQLite.
    ALLOW_SQLITE_FALLBACK: bool = os.getenv("ALLOW_SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")

    # ML Service endpoint
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

    # Mock LRMS endpoint
    MOCK_LRMS_URL: str = os.getenv("MOCK_LRMS_URL", "http://localhost:8002")

    # Storage paths
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./storage")
    ORIGINAL_SCANS_DIR: str = os.path.join(STORAGE_DIR, "original_scans")

    # n8n Automation & Webhook Integration
    ENABLE_N8N_WEBHOOKS: bool = os.getenv("ENABLE_N8N_WEBHOOKS", "true").lower() in ("true", "1", "yes")
    N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/veribhoomi-events")

    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://ncvowwkrzsiexvcrhpyi.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdm93d2tyenNpZXh2Y3JocHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTY3NjksImV4cCI6MjEwNTY3Mjc2OX0.kECJcrqnWeUfh18B8rldQQvdxJDg351n4H2DRhzq4F4")

    # Cryptographic Encryption Key for Storage at Rest (AES-256)
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "sih2026-veribhoomi-aes256-master-key-32b=")

    # CORS: Accepts list, comma-separated string, or wildcard string "*"
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            if "," in v:
                return [i.strip() for i in v.split(",") if i.strip()]
            return [v]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["*"]


    PORT: int = 8000
    JWT_SECRET: str = "veribhoomi-super-secret-jwt-key-2026-sih"

    class Config:
        case_sensitive = True
        extra = "ignore"
        env_file = ".env"

settings = Settings()
