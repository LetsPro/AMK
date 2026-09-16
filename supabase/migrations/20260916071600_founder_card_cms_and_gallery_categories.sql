/*
# Make founder-card content manageable from the About Us CMS editor + add gallery categories

## Part 1: Founder card content on website_pages

1. New Columns (on `website_pages`)
- `founder_name` (text) — founder's display name
- `founder_roles` (text) — founder's professional roles/credentials
- `founder_bio` (text) — short founder biography
- `founder_statement` (text) — founder's design philosophy statement

2. Data Backfill
- The About Us page (slug = 'about') is seeded with default founder content if the columns are null, so the founder card renders immediately without manual entry.

3. Important Notes
- All columns use ADD COLUMN IF NOT EXISTS, so re-runs are safe.
- No data is overwritten — coalesce preserves any values already set.

## Part 2: Gallery categories table

4. New Table
- `public.gallery_categories` — manages gallery category groupings with:
  - `id` (uuid, primary key)
  - `name` (text, not null) — category display name
  - `slug` (text, not null, unique) — URL-safe identifier
  - `description` (text) — optional category description
  - `display_order` (integer, not null, default 0) — sort order
  - `is_active` (boolean, not null, default true) — visibility toggle
  - `created_by` (uuid, references profiles) — who created the category
  - `created_at` / `updated_at` (timestamptz) — timestamps

5. Modified Table (`public.gallery`)
- `category_id` (uuid, references gallery_categories, ON DELETE SET NULL) — links gallery items to categories
- `media_type` (text, not null, default 'image') — distinguishes images from videos; CHECK constraint limits to ('image', 'video')

6. Data Backfill
- Existing gallery rows with a text `category` value are migrated: a gallery_categories row is created for each distinct category name (with a unique slug), and gallery rows are linked to their matching category via category_id.
- ON CONFLICT (slug) DO NOTHING prevents duplicate categories on re-runs.

7. Security
- RLS enabled on `gallery_categories`.
- Public SELECT policy: anyone can read active categories; authenticated users can see all (including inactive).
- Authenticated CRUD policy: authenticated users can insert, update, delete categories.
- Both policies use DROP POLICY IF EXISTS before CREATE for idempotency.

8. Indexes
- `gallery_categories_display_order_idx` on (display_order, name) for sorted listing.
- `gallery_category_id_idx` on gallery(category_id) for join performance.

9. Important Notes
- The updated_at trigger reuses the existing `public.touch_updated_at()` function.
- The CHECK constraint is added via a DO block to be idempotent.
- No destructive operations — all changes are additive.
*/

-- Part 1: Founder card columns on website_pages

alter table website_pages
add column if not exists founder_name text,
add column if not exists founder_roles text,
add column if not exists founder_bio text,
add column if not exists founder_statement text;

update website_pages
set
  founder_name = coalesce(founder_name, 'Ar. Andra Manoj Kumar'),
  founder_roles = coalesce(founder_roles, 'Architect | Computational Designer | BIM Specialist | Architectural Photographer'),
  founder_bio = coalesce(founder_bio, 'The studio is shaped around design clarity, BIM coordination, realistic visualization, and construction-ready decision making.'),
  founder_statement = coalesce(founder_statement, 'Architecture today demands more than drawings. It requires technology, data, visualization, and execution expertise working together. AMK creates spaces that are intelligent, efficient, sustainable, and timeless.')
where slug = 'about';

-- Part 2: Gallery categories table and gallery enhancements

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery
add column if not exists category_id uuid references public.gallery_categories(id) on delete set null,
add column if not exists media_type text not null default 'image';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gallery_media_type_check'
  ) then
    alter table public.gallery
    add constraint gallery_media_type_check check (media_type in ('image', 'video'));
  end if;
end $$;

insert into public.gallery_categories (name, slug, display_order)
select distinct
  trim(g.category),
  coalesce(nullif(lower(regexp_replace(trim(g.category), '[^a-zA-Z0-9]+', '-', 'g')), ''), 'category')
  || '-' || substr(md5(trim(g.category)), 1, 6),
  row_number() over (order by trim(g.category))
from public.gallery g
where nullif(trim(g.category), '') is not null
on conflict (slug) do nothing;

update public.gallery g
set category_id = c.id
from public.gallery_categories c
where g.category_id is null
and lower(trim(g.category)) = lower(trim(c.name));

drop trigger if exists set_gallery_categories_updated_at on public.gallery_categories;
create trigger set_gallery_categories_updated_at
before update on public.gallery_categories
for each row execute function public.touch_updated_at();

alter table public.gallery_categories enable row level security;

drop policy if exists "Public can view active gallery categories" on public.gallery_categories;
create policy "Public can view active gallery categories"
on public.gallery_categories for select
using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage gallery categories" on public.gallery_categories;
create policy "Authenticated users manage gallery categories"
on public.gallery_categories for all
to authenticated
using (true)
with check (true);

create index if not exists gallery_categories_display_order_idx
on public.gallery_categories(display_order, name);
create index if not exists gallery_category_id_idx on public.gallery(category_id);
