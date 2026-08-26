create table if not exists public.client_panorama_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  panorama_id uuid not null references public.panoramas(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  unique(client_id, panorama_id)
);

create index if not exists client_panorama_assignments_client_idx on public.client_panorama_assignments(client_id);
create index if not exists client_panorama_assignments_panorama_idx on public.client_panorama_assignments(panorama_id);

alter table public.client_panorama_assignments enable row level security;

drop policy if exists client_panorama_assignments_read on public.client_panorama_assignments;
create policy client_panorama_assignments_read on public.client_panorama_assignments
for select to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = client_panorama_assignments.client_id
      and c.auth_user_id = auth.uid()
  )
  or not exists (
    select 1 from public.clients current_client
    where current_client.auth_user_id = auth.uid()
  )
);

drop policy if exists client_panorama_assignments_internal_write on public.client_panorama_assignments;
create policy client_panorama_assignments_internal_write on public.client_panorama_assignments
for all to authenticated
using (
  not exists (
    select 1 from public.clients current_client
    where current_client.auth_user_id = auth.uid()
  )
)
with check (
  not exists (
    select 1 from public.clients current_client
    where current_client.auth_user_id = auth.uid()
  )
);

drop trigger if exists client_panorama_assignments_touch on public.client_panorama_assignments;
create trigger client_panorama_assignments_touch
before update on public.client_panorama_assignments
for each row execute function touch_updated_at();
