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
