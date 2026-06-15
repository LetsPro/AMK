create extension if not exists "pgcrypto";

create type role_name as enum ('Super Admin','Sales Manager','Sales Executive','Accountant','Project Manager','Staff','Support Executive');
create type publish_status as enum ('draft','published');
create type lead_status as enum ('New','Contacted','Follow Up','Proposal Sent','Converted','Lost');
create type project_status as enum ('Planning','Design','Approval','Execution','Completed');
create type task_status as enum ('Todo','In Progress','Review','Done');
create type priority_level as enum ('Low','Medium','High','Critical');
create type quote_status as enum ('Draft','Sent','Approved','Rejected');
create type invoice_status as enum ('Unpaid','Partial','Paid','Overdue');
create type payment_method as enum ('Cash','UPI','Bank Transfer','Cheque');
create type attendance_status as enum ('Present','Absent','Half Day','Leave');
create type leave_status as enum ('Pending','Approved','Rejected');
create type expense_category as enum ('Salary','Material','Office','Travel','Vendor','Utility');
create type ticket_status as enum ('Open','In Progress','Waiting','Resolved','Closed');

create table roles (id uuid primary key default gen_random_uuid(), name role_name unique not null, description text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text not null, email text not null unique, phone text, role_id uuid references roles(id), avatar_url text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table permissions (id uuid primary key default gen_random_uuid(), role_id uuid not null references roles(id) on delete cascade, module text not null, can_create boolean not null default false, can_read boolean not null default true, can_update boolean not null default false, can_delete boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz default now(), unique(role_id,module));

create table website_pages (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, content text not null default '', meta_title text, meta_description text, status publish_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz default now());
create table banners (id uuid primary key default gen_random_uuid(), title text not null, subtitle text, image_url text, cta_label text, cta_url text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table services (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text not null, image_url text, price_from numeric(14,2), status publish_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz default now());
create table customers (id uuid primary key default gen_random_uuid(), name text not null, company text, email text, mobile text, address text, notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table clients (id uuid primary key default gen_random_uuid(), customer_id uuid references customers(id) on delete set null, name text not null, contact_person text, email text, mobile text, address text, contract_value numeric(14,2), notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table projects (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, client_id uuid references clients(id) on delete set null, description text, category text, location text, status project_status not null default 'Planning', budget numeric(14,2), progress int not null default 0 check (progress between 0 and 100), start_date date, end_date date, cover_image_url text, published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table gallery (id uuid primary key default gen_random_uuid(), title text not null, image_url text not null, category text, project_id uuid references projects(id) on delete set null, is_featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table testimonials (id uuid primary key default gen_random_uuid(), name text not null, company text, quote text not null, rating int not null default 5 check (rating between 1 and 5), avatar_url text, is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz default now());

create table leads (id uuid primary key default gen_random_uuid(), lead_code text unique not null default ('LEAD-' || upper(substr(gen_random_uuid()::text,1,8))), name text not null, company text, mobile text, email text, address text, source text, service_interested text, budget numeric(14,2), notes text, status lead_status not null default 'New', assigned_to uuid references profiles(id) on delete set null, customer_id uuid references customers(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table enquiries (id uuid primary key default gen_random_uuid(), name text not null, email text, mobile text, subject text, message text not null, source text not null default 'website', lead_id uuid references leads(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table lead_activities (id uuid primary key default gen_random_uuid(), lead_id uuid not null references leads(id) on delete cascade, activity_type text not null, description text not null, due_at timestamptz, completed_at timestamptz, created_by uuid references profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table client_documents (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, title text not null, file_url text not null, file_type text not null, document_type text not null, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table project_tasks (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade, title text not null, description text, assignee_id uuid references profiles(id) on delete set null, status task_status not null default 'Todo', priority priority_level not null default 'Medium', due_date date, created_at timestamptz not null default now(), updated_at timestamptz default now());

create table calculations (id uuid primary key default gen_random_uuid(), title text not null, customer_id uuid references customers(id) on delete set null, lead_id uuid references leads(id) on delete set null, line_items jsonb not null default '[]', subtotal numeric(14,2) not null default 0, tax numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, grand_total numeric(14,2) not null default 0, quotation_id uuid, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table quotations (id uuid primary key default gen_random_uuid(), quote_no text unique not null default ('QT-' || to_char(now(),'YYYY') || '-' || upper(substr(gen_random_uuid()::text,1,6))), lead_id uuid references leads(id) on delete set null, customer_id uuid references customers(id) on delete set null, project_id uuid references projects(id) on delete set null, status quote_status not null default 'Draft', subtotal numeric(14,2) not null default 0, tax numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, grand_total numeric(14,2) not null default 0, valid_until date, notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
alter table calculations add constraint calculations_quotation_fk foreign key (quotation_id) references quotations(id) on delete set null;
create table quotation_items (id uuid primary key default gen_random_uuid(), quotation_id uuid not null references quotations(id) on delete cascade, description text not null, quantity numeric(12,2) not null default 1, unit text not null default 'Unit', rate numeric(14,2) not null default 0, amount numeric(14,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table invoices (id uuid primary key default gen_random_uuid(), invoice_no text unique not null default ('INV-' || to_char(now(),'YYYY') || '-' || upper(substr(gen_random_uuid()::text,1,6))), quotation_id uuid references quotations(id) on delete set null, customer_id uuid references customers(id) on delete set null, project_id uuid references projects(id) on delete set null, status invoice_status not null default 'Unpaid', subtotal numeric(14,2) not null default 0, tax numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, grand_total numeric(14,2) not null default 0, paid_total numeric(14,2) not null default 0, due_date date, notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table invoice_items (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references invoices(id) on delete cascade, description text not null, quantity numeric(12,2) not null default 1, unit text not null default 'Unit', rate numeric(14,2) not null default 0, amount numeric(14,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table payments (id uuid primary key default gen_random_uuid(), invoice_id uuid references invoices(id) on delete set null, customer_id uuid references customers(id) on delete set null, amount numeric(14,2) not null check (amount > 0), method payment_method not null, paid_at date not null default current_date, reference_no text, notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());

create table staff (id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id) on delete set null, employee_code text unique not null default ('EMP-' || upper(substr(gen_random_uuid()::text,1,6))), name text not null, email text, mobile text, department text, role_id uuid references roles(id) on delete set null, salary numeric(14,2), joined_at date, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table attendance (id uuid primary key default gen_random_uuid(), staff_id uuid not null references staff(id) on delete cascade, attendance_date date not null, check_in time, check_out time, status attendance_status not null default 'Present', created_at timestamptz not null default now(), updated_at timestamptz default now(), unique(staff_id, attendance_date));
create table leave_requests (id uuid primary key default gen_random_uuid(), staff_id uuid not null references staff(id) on delete cascade, from_date date not null, to_date date not null, reason text not null, status leave_status not null default 'Pending', reviewed_by uuid references profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table expenses (id uuid primary key default gen_random_uuid(), project_id uuid references projects(id) on delete set null, category expense_category not null, vendor text, amount numeric(14,2) not null check (amount >= 0), expense_date date not null default current_date, receipt_url text, notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table tickets (id uuid primary key default gen_random_uuid(), ticket_no text unique not null default ('TKT-' || upper(substr(gen_random_uuid()::text,1,8))), customer_id uuid references customers(id) on delete set null, subject text not null, description text not null, assigned_to uuid references profiles(id) on delete set null, priority priority_level not null default 'Medium', status ticket_status not null default 'Open', created_at timestamptz not null default now(), updated_at timestamptz default now());
create table ticket_comments (id uuid primary key default gen_random_uuid(), ticket_id uuid not null references tickets(id) on delete cascade, author_id uuid references profiles(id) on delete set null, comment text not null, is_internal boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, title text not null, message text not null, module text not null, entity_id uuid, is_read boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table activity_logs (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete set null, module text not null, action text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz default now());

create index on leads(status); create index on leads(assigned_to); create index on enquiries(lead_id); create index on projects(status); create index on project_tasks(project_id); create index on quotations(status); create index on invoices(status); create index on payments(invoice_id); create index on expenses(category); create index on attendance(attendance_date); create index on tickets(status); create index on notifications(user_id,is_read); create index on activity_logs(module,created_at desc);

create or replace function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$ begin insert into public.profiles(id, full_name, email, role_id) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email, (select id from roles where name='Staff')) on conflict (id) do nothing; return new; end $$;
create or replace function create_lead_from_enquiry() returns trigger language plpgsql security definer as $$ declare v_lead uuid; begin insert into leads(name,email,mobile,source,service_interested,notes,status) values (new.name,new.email,new.mobile,new.source,new.subject,new.message,'New') returning id into v_lead; update enquiries set lead_id = v_lead where id = new.id; insert into notifications(title,message,module,entity_id) values ('New website enquiry', new.name || ' submitted an enquiry', 'enquiries', new.id); return new; end $$;
create or replace function log_table_activity() returns trigger language plpgsql security definer as $$ begin insert into activity_logs(user_id,module,action,entity_id,metadata) values (auth.uid(), tg_table_name, tg_op, coalesce(new.id, old.id), jsonb_build_object('record', coalesce(to_jsonb(new), to_jsonb(old)))); return coalesce(new, old); end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create trigger enquiries_to_lead after insert on enquiries for each row execute function create_lead_from_enquiry();

do $$ declare t text; begin
  foreach t in array array['roles','profiles','permissions','website_pages','banners','services','projects','gallery','testimonials','enquiries','leads','lead_activities','customers','clients','client_documents','project_tasks','calculations','quotations','quotation_items','invoices','invoice_items','payments','staff','attendance','leave_requests','expenses','tickets','ticket_comments','notifications','activity_logs'] loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
  foreach t in array array['leads','customers','clients','projects','quotations','invoices','payments','staff','attendance','expenses','tickets','website_pages','services','gallery','testimonials'] loop
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function log_table_activity()', t, t);
  end loop;
end $$;

insert into roles(name, description) values
('Super Admin','Full platform access'),('Sales Manager','Sales team and lead oversight'),('Sales Executive','Lead and follow-up management'),('Accountant','Invoices, payments, expenses and reports'),('Project Manager','Projects, tasks and clients'),('Staff','Assigned internal work'),('Support Executive','Tickets and customer support')
on conflict (name) do nothing;

insert into permissions(role_id,module,can_create,can_read,can_update,can_delete)
select r.id, m.module, true, true, true, r.name='Super Admin'
from roles r cross join (values ('crm'),('customers'),('clients'),('projects'),('finance'),('staff'),('attendance'),('support'),('cms'),('reports')) as m(module)
on conflict (role_id,module) do nothing;

insert into website_pages(slug,title,content,status) values
('home','Home','AMK Architects & Engineers public homepage content.','published'),
('about','About Us','Company profile and values.','published'),
('contact','Contact Us','Contact information and enquiry form settings.','published')
on conflict (slug) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('website','website',true,10485760,array['image/png','image/jpeg','image/webp']),
('documents','documents',false,52428800,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','image/png','image/jpeg','image/webp']),
('receipts','receipts',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

alter table roles enable row level security; alter table profiles enable row level security; alter table permissions enable row level security; alter table website_pages enable row level security; alter table banners enable row level security; alter table services enable row level security; alter table projects enable row level security; alter table gallery enable row level security; alter table testimonials enable row level security; alter table enquiries enable row level security; alter table leads enable row level security; alter table lead_activities enable row level security; alter table customers enable row level security; alter table clients enable row level security; alter table client_documents enable row level security; alter table project_tasks enable row level security; alter table calculations enable row level security; alter table quotations enable row level security; alter table quotation_items enable row level security; alter table invoices enable row level security; alter table invoice_items enable row level security; alter table payments enable row level security; alter table staff enable row level security; alter table attendance enable row level security; alter table leave_requests enable row level security; alter table expenses enable row level security; alter table tickets enable row level security; alter table ticket_comments enable row level security; alter table notifications enable row level security; alter table activity_logs enable row level security;

create or replace function is_super_admin() returns boolean language sql stable security definer as $$ select exists(select 1 from profiles p join roles r on r.id=p.role_id where p.id=auth.uid() and r.name='Super Admin') $$;
create or replace function is_authenticated() returns boolean language sql stable as $$ select auth.uid() is not null $$;

do $$ declare t text; begin
  foreach t in array array['roles','profiles','permissions','leads','lead_activities','customers','clients','client_documents','project_tasks','calculations','quotations','quotation_items','invoices','invoice_items','payments','staff','attendance','leave_requests','expenses','tickets','ticket_comments','notifications','activity_logs','banners'] loop
    execute format('create policy %I_read_auth on %I for select to authenticated using (is_authenticated())', t, t);
    execute format('create policy %I_write_auth on %I for all to authenticated using (is_authenticated()) with check (is_authenticated())', t, t);
  end loop;
end $$;

create policy website_pages_public_read on website_pages for select to anon, authenticated using (status='published' or is_authenticated());
create policy website_pages_auth_write on website_pages for all to authenticated using (is_authenticated()) with check (is_authenticated());
create policy services_public_read on services for select to anon, authenticated using (status='published' or is_authenticated());
create policy services_auth_write on services for all to authenticated using (is_authenticated()) with check (is_authenticated());
create policy projects_public_read on projects for select to anon, authenticated using (published=true or is_authenticated());
create policy projects_auth_write on projects for all to authenticated using (is_authenticated()) with check (is_authenticated());
create policy gallery_public_read on gallery for select to anon, authenticated using (true);
create policy gallery_auth_write on gallery for all to authenticated using (is_authenticated()) with check (is_authenticated());
create policy testimonials_public_read on testimonials for select to anon, authenticated using (is_published=true or is_authenticated());
create policy testimonials_auth_write on testimonials for all to authenticated using (is_authenticated()) with check (is_authenticated());
create policy enquiries_public_insert on enquiries for insert to anon, authenticated with check (true);
create policy enquiries_auth_read on enquiries for select to authenticated using (is_authenticated());
create policy customers_public_insert on customers for insert to anon with check (true);

create policy storage_website_public_read on storage.objects for select using (bucket_id='website');
create policy storage_authenticated_insert on storage.objects for insert to authenticated with check (bucket_id in ('website','documents','receipts'));
create policy storage_authenticated_update on storage.objects for update to authenticated using (bucket_id in ('website','documents','receipts'));
create policy storage_authenticated_delete on storage.objects for delete to authenticated using (bucket_id in ('website','documents','receipts'));
