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
