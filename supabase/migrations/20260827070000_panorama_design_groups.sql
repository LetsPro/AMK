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
