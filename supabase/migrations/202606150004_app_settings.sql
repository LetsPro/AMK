create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

insert into app_settings(key, value) values
('branding', '{
  "companyName": "AMK Architects",
  "companySuffix": "& Engineers",
  "logoUrl": "",
  "primary": "#F86A0D",
  "accent": "#FF9B4A",
  "secondary": "#333333",
  "background": "#F8FAFC",
  "location": "Mysuru, Karnataka, India",
  "email": "ar.amk6616@gmail.com",
  "phone": "+91 98458 99066"
}'::jsonb)
on conflict (key) do nothing;

alter table app_settings enable row level security;

create policy app_settings_public_read on app_settings
for select to anon, authenticated
using (true);

create policy app_settings_auth_write on app_settings
for all to authenticated
using (is_authenticated())
with check (is_authenticated());

drop trigger if exists app_settings_touch on app_settings;
create trigger app_settings_touch
before update on app_settings
for each row execute function touch_updated_at();
