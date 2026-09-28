import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# If using SQLite, add check_same_thread=False
connect_args = {}
engine_kwargs = {"echo": False}

if settings.DATABASE_URL.startswith("sqlite"):
    if not settings.ALLOW_SQLITE_FALLBACK:
        raise RuntimeError(
            "\n" + "="*80 + "\n"
            "CRITICAL CONFIGURATION ERROR:\n"
            "DATABASE_URL is targeting SQLite, but ALLOW_SQLITE_FALLBACK is set to False!\n"
            "In production / demo deployment, a valid PostgreSQL + PostGIS instance (Supabase/Neon/Docker)\n"
            "must be configured via DATABASE_URL to support spatial geometry queries and concurrency.\n"
            "="*80 + "\n"
        )
    print("\n" + "#"*78)
    print("##" + " "*74 + "##")
    print("##   [!] WARNING: VERIBHOOMI RUNNING WITH LOCAL SQLITE FALLBACK ENGINE [!]  ##")
    print("##" + " "*74 + "##")
    print("##   1. PostGIS native geometry queries (ST_Contains/ST_Area) will be     ##")
    print("##      emulated in Python memory instead of database-accelerated R-Tree.  ##")
    print("##   2. High concurrency multi-role operations will experience DB locks.   ##")
    print("##   3. To activate production PostgreSQL + PostGIS:                       ##")
    print("##      Set DATABASE_URL=postgresql://user:pass@host:5432/veribhoomi_db    ##")
    print("##" + " "*74 + "##")
    print("#"*78 + "\n")
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / PostGIS hosted instance (Supabase / Neon / Railway / Local Postgres)
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    })

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Auto-redirect direct IPv6 Supabase host (db.xxx.supabase.co) to IPv4 pooler on IPv4-only platforms (like Render)
if "@db." in db_url and ".supabase.co" in db_url:
    import re
    match = re.search(r"://([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)/(.+)", db_url)
    if match:
        user, password, ref, port, db_name = match.groups()
        pooler_user = f"{user}.{ref}" if not user.endswith(f".{ref}") else user
        pooler_host = os.getenv("SUPABASE_POOLER_HOST", "aws-0-ap-south-1.pooler.supabase.com")
        db_url = f"postgresql://{pooler_user}:{password}@{pooler_host}:{port}/{db_name}"
        print(f"Notice: Automatically routed IPv6 Supabase direct host to IPv4 pooler: {pooler_host}")

# Ensure explicit driver dialect if generic postgresql:// is provided
if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    try:
        import psycopg
    except ImportError:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)


engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)


# If connected to PostgreSQL, ensure PostGIS extension exists
if not settings.DATABASE_URL.startswith("sqlite"):
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
    except Exception as e:
        print(f"Notice: PostGIS extension creation skipped or already enabled: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def apply_auto_migrations():
    """Ensure newly added columns exist in tables without breaking existing records"""
    from sqlalchemy import text
    with engine.connect() as conn:
        # Check and add columns to documents table
        doc_cols = [
            ("is_duplicate", "BOOLEAN DEFAULT 0"),
            ("duplicate_of_id", "VARCHAR(36)"),
            ("land_type", "VARCHAR(50) DEFAULT 'Agricultural'"),
            ("is_encrypted", "BOOLEAN DEFAULT 1"),
        ]
        for col_name, col_def in doc_cols:
            try:
                conn.execute(text(f"ALTER TABLE documents ADD COLUMN {col_name} {col_def};"))
                conn.commit()
            except Exception:
                pass

        # Check and add columns to notifications table
        notif_cols = [
            ("batch_id", "VARCHAR(36)"),
            ("sender_id", "VARCHAR(36)"),
            ("sender_role", "VARCHAR(50)"),
            ("parent_notification_id", "VARCHAR(36)"),
            ("action_type", "VARCHAR(50) DEFAULT 'redo_request'"),
        ]
        for col_name, col_def in notif_cols:
            try:
                conn.execute(text(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_def};"))
                conn.commit()
            except Exception:
                pass

try:
    apply_auto_migrations()
except Exception as e:
    print(f"Notice: Auto migration check: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

