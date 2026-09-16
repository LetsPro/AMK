/* Private, token-shared material recommendation guides. */

create table if not exists material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create table if not exists material_recommendations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references material_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text not null default '',
  document_url text,
  image_url text,
  video_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create table if not exists material_share_links (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references material_recommendations(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists material_recommendations_category_idx on material_recommendations(category_id);
create index if not exists material_share_links_recommendation_idx on material_share_links(recommendation_id);
create index if not exists material_share_links_token_idx on material_share_links(token);

drop trigger if exists material_categories_touch on material_categories;
create trigger material_categories_touch before update on material_categories for each row execute function touch_updated_at();
drop trigger if exists material_recommendations_touch on material_recommendations;
create trigger material_recommendations_touch before update on material_recommendations for each row execute function touch_updated_at();

alter table material_categories enable row level security;
alter table material_recommendations enable row level security;
alter table material_share_links enable row level security;

drop policy if exists material_categories_admin_all on material_categories;
create policy material_categories_admin_all on material_categories for all to authenticated using (is_authenticated()) with check (is_authenticated());
drop policy if exists material_recommendations_admin_all on material_recommendations;
create policy material_recommendations_admin_all on material_recommendations for all to authenticated using (is_authenticated()) with check (is_authenticated());
drop policy if exists material_share_links_admin_all on material_share_links;
create policy material_share_links_admin_all on material_share_links for all to authenticated using (is_authenticated()) with check (is_authenticated());

-- The public page receives only one published article through a valid share
-- token. Direct anonymous table reads remain blocked by RLS.
create or replace function get_material_recommendation_by_token(share_token text)
returns table (
  id uuid,
  title text,
  description text,
  document_url text,
  image_url text,
  video_url text,
  category_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    recommendation.id,
    recommendation.title,
    recommendation.description,
    recommendation.document_url,
    recommendation.image_url,
    recommendation.video_url,
    category.name,
    share.expires_at
  from material_share_links share
  join material_recommendations recommendation on recommendation.id = share.recommendation_id
  left join material_categories category on category.id = recommendation.category_id
  where share.token = share_token
    and share.revoked_at is null
    and (share.expires_at is null or share.expires_at > now())
    and recommendation.status = 'published'
  limit 1;
$$;

revoke all on function get_material_recommendation_by_token(text) from public;
grant execute on function get_material_recommendation_by_token(text) to anon, authenticated;

-- Allow public recommendation documents as well as media in the website bucket.
update storage.buckets
set
  file_size_limit = null,
  allowed_mime_types = array[
    'image/png', 'image/jpeg', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
where id = 'website';
