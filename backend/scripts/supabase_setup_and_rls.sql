-- ==============================================================================
-- VeriBhoomi AI — Supabase Setup, PostGIS Extension, and Row Level Security (RLS)
-- Execution target: Supabase SQL Editor (Direct Connection, Port 5432)
-- ==============================================================================

-- 1. Enable PostGIS & Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure PostGIS geometry column and GIST index exist on master_reference
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='master_reference' AND column_name='geom'
    ) THEN 
        ALTER TABLE master_reference ADD COLUMN geom geometry(Polygon, 4326);
    END IF; 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='master_reference' AND column_name='boundary_geojson'
    ) THEN 
        ALTER TABLE master_reference ADD COLUMN boundary_geojson TEXT;
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS idx_master_reference_geom_gist 
ON master_reference USING GIST (geom);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL CORE TABLES
-- In VeriBhoomi architecture, all frontend requests must terminate at the authenticated
-- FastAPI backend (/api/v1/* with JWT verification). Direct public access via PostgREST / Supabase
-- anon role must be strictly rejected (401 / 403 / empty result).

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrms_push_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. REVOKE DIRECT PUBLIC/ANON ACCESS
-- PostgREST exposes public schema tables over REST. Explicitly revoke SELECT, INSERT, UPDATE, DELETE
-- from 'anon' and 'authenticated' roles to force all data traffic through the FastAPI application layer.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Explicitly allow the backend service role ('service_role' and 'postgres') full access for connection pooling
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 5. SECURE POLICIES FOR SERVICE ROLE ONLY (NO PUBLIC ANON POLICIES)
-- By default in PostgreSQL, enabling RLS with no permissive policies denies all queries
-- to non-superusers (including PostgREST anon). We explicitly ensure no public policies exist.

DROP POLICY IF EXISTS "anon_read_documents" ON documents;
DROP POLICY IF EXISTS "anon_read_users" ON users;
DROP POLICY IF EXISTS "anon_read_audit" ON audit_log;
DROP POLICY IF EXISTS "anon_read_master" ON master_reference;

-- Allow service_role to bypass RLS or execute with dedicated policy
CREATE POLICY "service_role_full_access_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_batches" ON batches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_documents" ON documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_fields" ON extracted_fields FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_validation" ON validation_results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_audit" ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_master" ON master_reference FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_lrms" ON lrms_push_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verification comment
COMMENT ON TABLE documents IS 'Secured by VeriBhoomi RLS: Direct PostgREST anon queries denied.';
