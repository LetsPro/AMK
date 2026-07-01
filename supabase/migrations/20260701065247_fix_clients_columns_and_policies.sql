-- Ensure admin client creation has the columns and policies used by the portal UI.

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Hold','Completed','Inactive')),
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_auth_user_idx ON clients(auth_user_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_read_auth ON clients;
DROP POLICY IF EXISTS clients_write_auth ON clients;
DROP POLICY IF EXISTS clients_admin_all ON clients;

CREATE POLICY clients_read_auth
ON clients
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY clients_write_auth
ON clients
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);