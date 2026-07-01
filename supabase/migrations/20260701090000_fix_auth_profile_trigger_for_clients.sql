-- Fix Supabase Auth signup failures caused by the profiles trigger.
-- If a profile row already exists for the email, attach it to the new auth user.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_role_id uuid;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  v_role_id := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' = 'client' THEN NULL
    ELSE (SELECT id FROM public.roles WHERE name = 'Staff')
  END;

  INSERT INTO public.profiles(id, full_name, email, role_id, is_active)
  VALUES (NEW.id, v_full_name, NEW.email, v_role_id, true)
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role_id = EXCLUDED.role_id,
    is_active = true;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.profiles
    SET
      id = NEW.id,
      full_name = v_full_name,
      email = NEW.email,
      role_id = v_role_id,
      is_active = true
    WHERE lower(email) = lower(NEW.email);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

UPDATE public.profiles
SET role_id = NULL
WHERE id IN (
  SELECT auth_user_id
  FROM public.clients
  WHERE auth_user_id IS NOT NULL
);
