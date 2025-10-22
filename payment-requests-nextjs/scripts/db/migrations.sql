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