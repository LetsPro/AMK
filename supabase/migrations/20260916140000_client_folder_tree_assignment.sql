/* Assign or hide a complete folder tree in one operation. */

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
