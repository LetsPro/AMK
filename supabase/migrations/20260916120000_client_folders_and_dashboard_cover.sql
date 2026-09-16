/*
  Link document folders to clients and allow administrators to control whether
  their contents appear in the client portal. Also store a client-level
  elevation/cover image for the dashboard.
*/

alter table clients
  add column if not exists dashboard_cover_image_url text;

alter table folders
  add column if not exists client_id uuid references clients(id) on delete set null,
  add column if not exists is_client_visible boolean not null default false;

create index if not exists folders_client_idx on folders(client_id);

-- Preserve the existing convention where a root folder is named after a
-- client, but turn that convention into a real relationship.
update folders as folder
set
  client_id = client.id,
  is_client_visible = true
from clients as client
where folder.client_id is null
  and folder.parent_id is null
  and lower(trim(folder.name)) = lower(trim(client.name));

-- Existing children of a linked folder inherit the same client and visibility.
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
