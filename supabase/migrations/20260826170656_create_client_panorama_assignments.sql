/*
# Create client-panorama assignments table

1. New Table
- `client_panorama_assignments` — links a client to a panorama so that specific 360-degree tours can be shared with individual clients.
  - id (uuid PK)
  - client_id (uuid, FK -> clients, cascade delete)
  - panorama_id (uuid, FK -> panoramas, cascade delete)
  - assigned_by (uuid, FK -> auth.users, set null on delete, defaults to auth.uid())
  - created_at, updated_at (timestamps)
  - UNIQUE constraint on (client_id, panorama_id) to prevent duplicate assignments

2. Indexes
- `client_panorama_assignments_client_idx` on client_id — fast lookup of all panoramas assigned to a client
- `client_panorama_assignments_panorama_idx` on panorama_id — fast lookup of all clients assigned a given panorama

3. Security (RLS)
- RLS enabled on the table.
- SELECT policy: authenticated users can read their own assignments (matched via clients.auth_user_id = auth.uid()), OR all assignments if they are NOT a client user (i.e. admin/staff users who don't have a client record).
- Write policy (FOR ALL): only non-client authenticated users (admins/staff) can insert, update, or delete assignments. Client users are blocked from writing.

4. Trigger
- `client_panorama_assignments_touch` — auto-updates updated_at on row modification via existing touch_updated_at() function.

5. Important Notes
- This migration is idempotent: CREATE TABLE IF NOT EXISTS, indexes use IF NOT EXISTS, policies are dropped before re-creation.
- Requires pre-existing tables: clients (with auth_user_id column) and panoramas.
- Requires pre-existing helper function: touch_updated_at().
*/

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
