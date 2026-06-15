# AMK Architects & Engineers CRM

Production Vite + React + TypeScript application for AMK Architects & Engineers, connected to Supabase Auth, PostgreSQL, Storage, Realtime-ready notifications, and RLS.

## Included

- Public website with enquiries that create CRM leads.
- Supabase Auth login, logout, forgot password, reset password, protected routes, and role profile loading.
- Executive dashboard with live Supabase metrics and Recharts.
- CRM, customers, clients, projects, quotations, invoices, payments, staff, attendance, expenses, support tickets, CMS, reports, and activity logs.
- Cost calculator with conversion to quotation.
- PDF and CSV exports.
- Full PostgreSQL schema, constraints, indexes, triggers, RLS policies, storage buckets, and seed roles.

## Start

```bash
cp .env.example .env
npm install
npm run dev
```

See [Deployment Guide](docs/deployment-guide.md).

## Seeded Admin

After applying the Supabase migration:

- Email: `admin@amkarchitects.com`
- Password: `AMK@Admin#2026`

Change this password before production use.
