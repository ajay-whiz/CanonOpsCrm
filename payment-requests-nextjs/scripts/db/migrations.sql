CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum for payment request status
DO $$ BEGIN
  CREATE TYPE pr_status AS ENUM ('staging', 'pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Contacts table (requestors, vendors, etc.)
CREATE TABLE IF NOT EXISTS contact (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Container table (projects, cost centers, etc.)
CREATE TABLE IF NOT EXISTS container (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    external_id TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique indexes to enable deterministic upserts
CREATE UNIQUE INDEX IF NOT EXISTS container_external_id_uidx ON container(external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS container_name_uidx ON container(name);

-- Canonical payment request table
CREATE TABLE IF NOT EXISTS payment_request (
    id SERIAL PRIMARY KEY,
    created_by INTEGER REFERENCES users(id),
    contact_id INTEGER REFERENCES contact(id),
    container_id INTEGER REFERENCES container(id),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    pr_status pr_status NOT NULL DEFAULT 'staging',
    asana_id TEXT,
    title TEXT,
    due_date DATE,
    approval_history JSONB DEFAULT '[]'::jsonb,
    drive_folder_id TEXT,
    qbo_vendor_id TEXT,
    raw JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes for integrations
CREATE INDEX IF NOT EXISTS pr_asana_id_idx ON payment_request(asana_id);
CREATE INDEX IF NOT EXISTS pr_status_idx ON payment_request(pr_status);
CREATE INDEX IF NOT EXISTS pr_contact_container_idx ON payment_request(contact_id, container_id);

-- Audit log of important events
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotency: track processed webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    event_id TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (source, event_id)
);

-- Optional: integrations registry
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    service_name VARCHAR(100) NOT NULL,
    service_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secrets storage for OAuth tokens and service creds (store encrypted at rest via Supabase configuration)
CREATE TABLE IF NOT EXISTS secrets (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
-- Restrict secrets to admin only
CREATE POLICY IF NOT EXISTS secrets_read_admin
  ON secrets FOR SELECT TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin'));
CREATE POLICY IF NOT EXISTS secrets_write_admin
  ON secrets FOR ALL TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin'))
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin'));

-- RLS scaffolding (enable and basic policies)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE container ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admin/finance/support roles via JWT claim: role
-- NOTE: Adjust to your Supabase JWT claim path. Example: request.jwt.claims ->> 'role'
-- Allow read to authenticated users on minimal tables; restrict write.

-- Documents table for uploaded files (Drive or others)
CREATE TABLE IF NOT EXISTS document (
    id BIGSERIAL PRIMARY KEY,
    pr_id INTEGER REFERENCES payment_request(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
    drive_file_id TEXT,
    file_name TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE document ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated can read; write restricted to admin|finance|support
CREATE POLICY IF NOT EXISTS document_select
  ON document FOR SELECT TO authenticated
  USING (true);
CREATE POLICY IF NOT EXISTS document_write
  ON document FOR INSERT TO authenticated
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support'));
CREATE POLICY IF NOT EXISTS document_update
  ON document FOR UPDATE TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support'))
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support'));

CREATE INDEX IF NOT EXISTS document_pr_idx ON document(pr_id);
CREATE INDEX IF NOT EXISTS document_contact_idx ON document(contact_id);
CREATE POLICY IF NOT EXISTS contact_read_auth
  ON contact FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS container_read_auth
  ON container FOR SELECT
  TO authenticated
  USING (true);

-- contact write policies (staff only)
CREATE POLICY IF NOT EXISTS contact_insert_staff
  ON contact FOR INSERT
  TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  );

CREATE POLICY IF NOT EXISTS contact_update_staff
  ON contact FOR UPDATE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  );

-- container write policies (staff only)
CREATE POLICY IF NOT EXISTS container_insert_staff
  ON container FOR INSERT
  TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  );

CREATE POLICY IF NOT EXISTS container_update_staff
  ON container FOR UPDATE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  );

-- payment_request policies
CREATE POLICY IF NOT EXISTS pr_select_auth
  ON payment_request FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS pr_insert_staff
  ON payment_request FOR INSERT
  TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  );

CREATE POLICY IF NOT EXISTS pr_update_staff
  ON payment_request FOR UPDATE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance')
  );
-- audit_log read for staff only
CREATE POLICY IF NOT EXISTS audit_log_read_staff
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','finance','support')
  );

-- Demo admin user seed (idempotent)
-- Note: password is a placeholder and not used by Supabase auth. Adjust if your app reads from this table for auth.
INSERT INTO users (email, password, role)
VALUES ('demo.admin@example.com', 'demo-password-change-me', 'admin')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role;

-- Lead/Enquiry Module -------------------------------------------------------
-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','won','lost','spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE lead_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM ('web_form','email','phone','referral','import','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Leads table (references existing contact(id) and users(id))
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  priority lead_priority NOT NULL DEFAULT 'medium',
  source lead_source NOT NULL DEFAULT 'web_form',
  asana_task_gid TEXT,
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  next_touch_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper: updated_at trigger (idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS leads_contact_idx ON leads(contact_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_asana_gid_idx ON leads(asana_task_gid);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

-- Lead audit table
CREATE TABLE IF NOT EXISTS lead_audit (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  event TEXT NOT NULL, -- created|updated|assigned|status_changed|asana_linked|...
  details JSONB DEFAULT '{}'::jsonb,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger (insert/update on leads)
CREATE OR REPLACE FUNCTION audit_lead_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO lead_audit(lead_id, event, details, actor_user_id)
    VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO lead_audit(lead_id, event, details, actor_user_id)
    VALUES (NEW.id, 'updated', jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)), NEW.assigned_to);
    RETURN NEW;
  END IF;
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS trg_leads_audit ON leads;
CREATE TRIGGER trg_leads_audit
AFTER INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION audit_lead_changes();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_audit ENABLE ROW LEVEL SECURITY;

-- Read: allow all authenticated to read leads (align with existing pattern),
-- write restricted to admin/support. Adjust later if user-id claims are available.
CREATE POLICY IF NOT EXISTS leads_select_auth
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS leads_insert_staff
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','support'));

CREATE POLICY IF NOT EXISTS leads_update_staff
  ON leads FOR UPDATE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','support'))
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','support'));

-- lead_audit: read for staff only
CREATE POLICY IF NOT EXISTS lead_audit_read_staff
  ON lead_audit FOR SELECT
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin','support'));