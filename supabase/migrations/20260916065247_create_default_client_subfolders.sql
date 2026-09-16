/*
# Auto-create standard project-document sub-folders inside client folders

1. New Function
- `create_default_client_subfolders()` — a SECURITY DEFINER trigger function that runs AFTER INSERT on the `folders` table. When a new root-level folder (no parent) is linked to a client, it automatically creates five standard sub-folders: Architectural Drawings, Structural Drawings, Electrical Drawings, 360 Interiors, and Interior Detail Drawings. Each sub-folder inherits the parent's client_id and is marked client-visible.

2. New Trigger
- `folders_create_client_defaults` — AFTER INSERT trigger on `folders` that calls `create_default_client_subfolders()` for each new row.

3. Data Backfill
- For all existing root-level client-linked folders, the five standard sub-folders are created if they don't already exist (case-insensitive name check avoids duplicates with manually created folders).

4. Security
- The trigger function is SECURITY DEFINER so it can insert sub-folders regardless of the caller's RLS context.
- No new policies — the existing folder RLS policies govern access to both parent and child folders.

5. Important Notes
- Idempotent: CREATE OR REPLACE for the function, DROP TRIGGER IF EXISTS before creating the trigger, and NOT EXISTS checks prevent duplicate sub-folders on re-runs.
- The backfill only creates missing sub-folders; it never touches or renames existing ones.
- Sub-folders inherit the parent folder's path convention (parent.path || parent.name || '/').
*/

create or replace function create_default_client_subfolders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_id is null and new.client_id is not null then
    insert into folders (name, parent_id, path, client_id, is_client_visible, created_by)
    select
      default_folder.name,
      new.id,
      new.path || new.name || '/',
      new.client_id,
      true,
      new.created_by
    from (values
      ('Architectural Drawings'),
      ('Structural Drawings'),
      ('Electrical Drawings'),
      ('360 Interiors'),
      ('Interior Detail Drawings')
    ) as default_folder(name)
    where not exists (
      select 1 from folders existing
      where existing.parent_id = new.id
      and lower(trim(existing.name)) = lower(trim(default_folder.name))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists folders_create_client_defaults on folders;
create trigger folders_create_client_defaults
after insert on folders
for each row execute function create_default_client_subfolders();

insert into folders (name, parent_id, path, client_id, is_client_visible, created_by)
select
  default_folder.name,
  root.id,
  root.path || root.name || '/',
  root.client_id,
  true,
  root.created_by
from folders root
cross join (values
  ('Architectural Drawings'),
  ('Structural Drawings'),
  ('Electrical Drawings'),
  ('360 Interiors'),
  ('Interior Detail Drawings')
) as default_folder(name)
where root.parent_id is null
and root.client_id is not null
and not exists (
  select 1 from folders existing
  where existing.parent_id = root.id
  and lower(trim(existing.name)) = lower(trim(default_folder.name))
);
