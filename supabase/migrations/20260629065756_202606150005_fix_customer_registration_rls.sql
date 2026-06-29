/*
# Fix Customer Registration RLS

Drops the restrictive anon-only insert policy on customers and replaces it with one that
allows both anon and authenticated users to insert — enabling the customer self-registration
flow to work regardless of auth state.
*/

drop policy if exists customers_public_insert on customers;

create policy customers_public_insert on customers
for insert to anon, authenticated
with check (true);
