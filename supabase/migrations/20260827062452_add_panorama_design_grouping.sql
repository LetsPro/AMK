/*
# Add design grouping columns to panoramas table

1. New Columns
- `panoramas.design_id` (uuid, not null, default gen_random_uuid()) — groups multiple panoramic spaces (e.g. living room, kitchen, bedroom) into a single 360 interior design. Each panorama gets a unique design_id by default, but multiple panoramas can share the same design_id to form one composite design.
- `panoramas.design_title` (text, not null, default '360 Interior Design') — shared title displayed for the complete 360 interior design when panoramas are grouped together.

2. Data Backfill
- Existing panoramas have their design_title set to their individual title, so they retain their current display name rather than showing the generic default.

3. New Index
- `panoramas_design_order_idx` on (design_id, display_order) — optimizes fetching all spaces within a design, ordered for display.

4. Important Notes
- This migration is idempotent: uses ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
- No RLS or policy changes — existing access controls remain unchanged.
- Each existing panorama gets its own unique design_id (via gen_random_uuid default), effectively making each one its own standalone design. New panoramas created together can share a design_id to group them.
*/

alter table public.panoramas
  add column if not exists design_id uuid not null default gen_random_uuid(),
  add column if not exists design_title text not null default '360 Interior Design';

update public.panoramas
set design_title = title
where design_title = '360 Interior Design';

create index if not exists panoramas_design_order_idx
  on public.panoramas (design_id, display_order);

comment on column public.panoramas.design_id is
  'Groups multiple panoramic spaces into one 360 interior design.';
comment on column public.panoramas.design_title is
  'Shared title displayed for the complete 360 interior design.';
