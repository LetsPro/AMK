/* Published hero slides must be readable on the logged-out public website. */

drop policy if exists banners_public_read on banners;
create policy banners_public_read
on banners
for select
to anon, authenticated
using (is_active = true or is_authenticated());
