alter table public.panoramas
  add column if not exists is_public boolean not null default true;

create index if not exists panoramas_public_listing_idx
  on public.panoramas (is_public, status, category_id, display_order);

comment on column public.panoramas.is_public is
  'Controls whether a published panorama appears on the public website. Client assignments remain independent.';

drop policy if exists panoramas_public_read on public.panoramas;
create policy panoramas_public_read on public.panoramas
for select to anon, authenticated
using ((status = 'published' and is_public) or is_authenticated());
