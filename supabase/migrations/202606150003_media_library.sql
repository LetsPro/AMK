create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'website',
  path text not null,
  url text not null,
  file_name text not null,
  mime_type text,
  size bigint,
  alt_text text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  unique(bucket, path)
);

create index if not exists media_assets_bucket_created_idx on media_assets(bucket, created_at desc);
create index if not exists media_assets_mime_type_idx on media_assets(mime_type);

alter table media_assets enable row level security;

create policy media_assets_read_auth on media_assets
for select to authenticated
using (is_authenticated());

create policy media_assets_write_auth on media_assets
for all to authenticated
using (is_authenticated())
with check (is_authenticated());

create policy media_assets_public_website_read on media_assets
for select to anon
using (bucket = 'website');

drop trigger if exists media_assets_touch on media_assets;
create trigger media_assets_touch
before update on media_assets
for each row execute function touch_updated_at();
