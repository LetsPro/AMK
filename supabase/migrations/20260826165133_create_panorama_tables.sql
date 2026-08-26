/*
# Create panorama categories and panoramas tables

1. New Tables
- `panorama_categories` — groups panorama/360-degree images into categories (e.g. interior tours, exterior views)
  - id (uuid PK), name, slug (unique), description, display_order, is_active, created_at, updated_at
- `panoramas` — individual panorama images linked to a category
  - id (uuid PK), category_id (FK -> panorama_categories, cascade delete), title, description, image_url, status (draft/published), display_order, created_at, updated_at

2. Indexes
- `panorama_categories_order_idx` on panorama_categories(display_order)
- `panoramas_category_order_idx` on panoramas(category_id, display_order)

3. Security (RLS)
- Both tables have RLS enabled.
- Public read: anon + authenticated can read active/published categories and panoramas. Authenticated users can additionally read all rows regardless of status.
- Authenticated write: any authenticated user can perform all CRUD operations on both tables (admin-managed content).

4. Triggers
- `panorama_categories_touch` and `panoramas_touch` — auto-update updated_at on row modification via existing touch_updated_at() function.

5. Storage
- Raises the file size limit on the 'website' storage bucket to 50 MB to accommodate larger panorama images.

6. Important Notes
- This migration is idempotent: all CREATE statements use IF NOT EXISTS, and policies are dropped before re-creation.
- Requires pre-existing helper functions: is_authenticated() and touch_updated_at() — both created in earlier platform migrations.
*/

create table if not exists public.panorama_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create table if not exists public.panoramas (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.panorama_categories(id) on delete cascade,
  title text not null,
  description text,
  image_url text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create index if not exists panorama_categories_order_idx on public.panorama_categories(display_order);
create index if not exists panoramas_category_order_idx on public.panoramas(category_id, display_order);

alter table public.panorama_categories enable row level security;
alter table public.panoramas enable row level security;

drop policy if exists panorama_categories_public_read on public.panorama_categories;
create policy panorama_categories_public_read on public.panorama_categories
for select to anon, authenticated
using (is_active or is_authenticated());

drop policy if exists panorama_categories_auth_write on public.panorama_categories;
create policy panorama_categories_auth_write on public.panorama_categories
for all to authenticated
using (is_authenticated())
with check (is_authenticated());

drop policy if exists panoramas_public_read on public.panoramas;
create policy panoramas_public_read on public.panoramas
for select to anon, authenticated
using (status = 'published' or is_authenticated());

drop policy if exists panoramas_auth_write on public.panoramas;
create policy panoramas_auth_write on public.panoramas
for all to authenticated
using (is_authenticated())
with check (is_authenticated());

drop trigger if exists panorama_categories_touch on public.panorama_categories;
create trigger panorama_categories_touch
before update on public.panorama_categories
for each row execute function touch_updated_at();

drop trigger if exists panoramas_touch on public.panoramas;
create trigger panoramas_touch
before update on public.panoramas
for each row execute function touch_updated_at();

update storage.buckets
set file_size_limit = greatest(coalesce(file_size_limit, 0), 52428800)
where id = 'website';
