/*
# Re-apply public read policy for published hero banner slides

1. Security Changes
- Drops and recreates the `banners_public_read` SELECT policy on the `banners` table.
- Allows both `anon` and `authenticated` roles to read banner rows where:
  - `is_active` is true (published slides visible to everyone), OR
  - the caller is an authenticated user (admin/client can see all banners for management).
- This ensures the logged-out public website can display active hero slides.

2. Important Notes
- Idempotent: DROP POLICY IF EXISTS before CREATE ensures safe re-runs.
- No data changes — only a policy is replaced.
- No other CRUD policies on `banners` are affected.
*/

drop policy if exists banners_public_read on banners;

create policy banners_public_read
on banners
for select
to anon, authenticated
using (is_active = true or is_authenticated());
