/* Create the standard project-document structure inside every client folder. */

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

-- Backfill existing client root folders without duplicating folders that an
-- administrator already created manually.
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
