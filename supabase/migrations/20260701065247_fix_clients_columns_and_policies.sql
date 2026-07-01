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

-- Client portal auth users must not receive a staff/admin role through the
-- generic auth trigger. Staff users keep the default Staff role.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE
      WHEN NEW.raw_user_meta_data->>'account_type' = 'client' THEN NULL
      ELSE (SELECT id FROM roles WHERE name = 'Staff')
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role_id = CASE
      WHEN NEW.raw_user_meta_data->>'account_type' = 'client' THEN NULL
      ELSE public.profiles.role_id
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

UPDATE profiles
SET role_id = NULL
WHERE id IN (
  SELECT auth_user_id
  FROM clients
  WHERE auth_user_id IS NOT NULL
);