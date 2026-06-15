# AMK Architects & Engineers CRM Deployment Guide

## 1. Create Supabase Project

1. Create a Supabase project.
2. Copy the project URL and anon key into `.env`.
3. Apply the migration:

```bash
supabase db push
```

Or paste `supabase/migrations/202606150001_amk_architects_platform.sql` into the Supabase SQL editor.

## 2. Configure Auth

1. In Supabase Auth, enable Email provider.
2. Add site URL for production and local development:
   - `http://localhost:5173`
   - your production domain
3. The migration seeds a bootstrap Super Admin:

```text
Email: admin@amkarchitects.com
Password: AMK@Admin#2026
```

Rotate this password before production use.

4. To assign another user as Super Admin:

```sql
update profiles
set role_id = (select id from roles where name = 'Super Admin')
where email = 'admin@example.com';
```

## 3. Storage

The migration creates:

- `website` for public website images.
- `documents` for contracts, drawings, PDFs, DOCX, XLSX, ZIP files.
- `receipts` for expenses.

## 4. Local Development

```bash
cp .env.example .env
npm install
npm run dev
```

## 5. Production Build

```bash
npm run build
```

Deploy the generated Vite app to Vercel, Netlify, Cloudflare Pages, or any static hosting provider. Set these environment variables in the hosting dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_COMPANY_EMAIL`
- `VITE_COMPANY_PHONE`

For Vercel, `vercel.json` rewrites all routes to `index.html` so direct browser visits to `/login`, `/app`, `/projects/:slug`, and other React Router routes do not return `404: NOT_FOUND`.

## 6. Realtime Notifications

Enable Realtime replication for `notifications`, `leads`, `tickets`, and `enquiries` in Supabase if live push updates are required across browser tabs.

## 7. Operational Notes

- Public contact enquiries insert into `enquiries`.
- Database trigger `create_lead_from_enquiry` automatically creates a CRM lead.
- All major write operations are logged to `activity_logs`.
- Role-based access is seeded through `roles` and `permissions`; tighten policies per module before exposing highly sensitive finance or salary data to broad staff groups.
