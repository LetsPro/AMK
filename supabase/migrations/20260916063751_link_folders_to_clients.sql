/*
# Link document folders to clients and control client portal visibility

1. New Columns
- `clients.dashboard_cover_image_url` (text, nullable) — client-level elevation/cover image shown on the client dashboard.
- `folders.client_id` (uuid, nullable, references clients(id) on delete set null) — links a folder to a specific client.
- `folders.is_client_visible` (boolean, not null, default false) — controls whether folder contents appear in the client portal.

2. New Index
- `folders_client_idx` on folders(client_id) — optimizes client-folder lookups.

3. Data Backfill
- Root folders whose name matches a client name (case-insensitive) are automatically linked to that client and marked client-visible.
- Child folders of linked root folders inherit the same client_id and is_client_visible via a recursive CTE.

4. Important Notes
- Idempotent: uses ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
- Backfill only touches folders where client_id is null, so admin-set values are never overwritten.
- No RLS or policy changes — existing access controls remain unchanged.
*/

alter table clients
add column if not exists dashboard_cover_image_url text;

alter table folders
add column if not exists client_id uuid references clients(id) on delete set null,
add column if not exists is_client_visible boolean not null default false;

create index if not exists folders_client_idx on folders(client_id);

update folders as folder
set
  client_id = client.id,
  is_client_visible = true
from clients as client
where folder.client_id is null
and folder.parent_id is null
and lower(trim(folder.name)) = lower(trim(client.name));

with recursive linked_folders as (
  select id, client_id, is_client_visible
  from folders
  where client_id is not null

  union all

  select child.id, parent.client_id, parent.is_client_visible
  from folders child
  join linked_folders parent on child.parent_id = parent.id
  where child.client_id is null
)
update folders as folder
set
  client_id = linked.client_id,
  is_client_visible = linked.is_client_visible
from linked_folders linked
where folder.id = linked.id
and folder.client_id is null;
