/*
# Assign or hide a complete folder tree in one operation

1. New Function
- `assign_client_folder_tree(target_folder_id uuid, target_client_id uuid, target_visible boolean)` — SECURITY DEFINER function that assigns an entire folder and all its sub-folders to a client (or unassigns them), and sets client portal visibility in a single recursive operation.

2. Behavior
- Recursively traverses the folder tree starting from target_folder_id through all descendants.
- Sets client_id and is_client_visible on every folder in the tree.
- If target_client_id is null, is_client_visible is forced to false (unassigning).
- Updates updated_at on all touched folders.
- Requires authentication (auth.uid() must be non-null).

3. Security
- SECURITY DEFINER — runs with the function owner's privileges, bypassing RLS so it can update the full tree in one call.
- Access revoked from public; granted only to authenticated role.
- Explicit auth check at the top of the function body.

4. Important Notes
- Idempotent: CREATE OR REPLACE allows re-running safely.
- Uses a recursive CTE to find all descendant folders.
- No data loss — only updates client_id and is_client_visible columns.
*/

create or replace function assign_client_folder_tree(
  target_folder_id uuid,
  target_client_id uuid,
  target_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  with recursive folder_tree as (
    select id from folders where id = target_folder_id
    union all
    select child.id
    from folders child
    join folder_tree parent on child.parent_id = parent.id
  )
  update folders
  set
    client_id = target_client_id,
    is_client_visible = case when target_client_id is null then false else target_visible end,
    updated_at = now()
  where id in (select id from folder_tree);
end;
$$;

revoke all on function assign_client_folder_tree(uuid, uuid, boolean) from public;
grant execute on function assign_client_folder_tree(uuid, uuid, boolean) to authenticated;
