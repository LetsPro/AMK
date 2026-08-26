/*
# Add display_order columns and font settings

1. New Columns
- `banners.display_order` (integer, not null, default 0) — controls banner slide ordering on the homepage
- `testimonials.display_order` (integer, not null, default 0) — controls testimonial carousel ordering
- `gallery.display_order` (integer, not null, default 0) — controls gallery image ordering

2. Data Backfill
- Existing rows in all three tables are assigned sequential display_order values based on created_at ascending order.
- Only rows with display_order = 0 are updated, making this safe to re-run.

3. Indexes
- `banners_display_order_idx` on banners(display_order)
- `testimonials_display_order_idx` on testimonials(display_order)
- `gallery_display_order_idx` on gallery(display_order)

4. App Settings Update
- Adds bodyFont and headingFont keys to the branding settings JSON, defaulting to 'Inter' and 'Manrope' respectively, without overwriting existing values.

5. Security
- No RLS or policy changes. Existing access controls remain unchanged.
*/

alter table public.banners
  add column if not exists display_order integer not null default 0;

alter table public.testimonials
  add column if not exists display_order integer not null default 0;

alter table public.gallery
  add column if not exists display_order integer not null default 0;

with ranked as (
  select id, row_number() over (order by created_at asc) as position
  from public.banners
)
update public.banners
set display_order = ranked.position
from ranked
where public.banners.id = ranked.id
  and public.banners.display_order = 0;

with ranked as (
  select id, row_number() over (order by created_at asc) as position
  from public.testimonials
)
update public.testimonials
set display_order = ranked.position
from ranked
where public.testimonials.id = ranked.id
  and public.testimonials.display_order = 0;

with ranked as (
  select id, row_number() over (order by created_at asc) as position
  from public.gallery
)
update public.gallery
set display_order = ranked.position
from ranked
where public.gallery.id = ranked.id
  and public.gallery.display_order = 0;

create index if not exists banners_display_order_idx on public.banners(display_order);
create index if not exists testimonials_display_order_idx on public.testimonials(display_order);
create index if not exists gallery_display_order_idx on public.gallery(display_order);

update public.app_settings
set value = jsonb_build_object(
  'bodyFont', coalesce(value->>'bodyFont', 'Inter'),
  'headingFont', coalesce(value->>'headingFont', 'Manrope')
) || value
where key = 'branding';
