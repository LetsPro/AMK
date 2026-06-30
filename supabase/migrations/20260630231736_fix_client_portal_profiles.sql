-- Ensure existing client portal auth users are not treated as staff/admin users.
-- The auth trigger creates every profile with the default Staff role; client
-- portal users should be identified by clients.auth_user_id instead.

update profiles
set
  role_id = null,
  is_active = true,
  updated_at = now()
where id in (
  select auth_user_id
  from clients
  where auth_user_id is not null
);

