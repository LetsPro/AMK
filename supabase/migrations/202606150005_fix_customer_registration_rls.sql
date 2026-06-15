drop policy if exists customers_public_insert on customers;

create policy customers_public_insert on customers
for insert to anon, authenticated
with check (true);
