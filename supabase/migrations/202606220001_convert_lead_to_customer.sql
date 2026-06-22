create or replace function convert_lead_to_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  if new.status = 'Converted' and new.customer_id is null then
    insert into customers (name, company, email, mobile, address, notes)
    values (
      new.name,
      new.company,
      new.email,
      new.mobile,
      new.address,
      coalesce(new.notes, 'Converted from lead')
    )
    returning id into v_customer_id;

    new.customer_id := v_customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_convert_to_customer on leads;
create trigger leads_convert_to_customer
before insert or update of status on leads
for each row
execute function convert_lead_to_customer();
