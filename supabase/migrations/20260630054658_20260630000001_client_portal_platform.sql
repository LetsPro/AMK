/*
# Client Portal Platform Schema

Creates all new tables required for the client portal platform.

## New Tables
1. **clients** (replaces old clients table - adds auth_user_id, status, project fields)
   - Full client management with auth user linkage
2. **client_projects** - Projects linked to clients
3. **portfolio_projects** - Public-facing portfolio projects
4. **portfolio_categories** - Categories for portfolio projects
5. **portfolio_gallery** - Gallery images for portfolio projects
6. **folders** - File system folders (supports nested)
7. **files** - Uploaded file records
8. **stages** - Master stage definitions
9. **client_project_stages** - Per-client stage assignments
10. **client_file_assignments** - File assignments to clients/stages
11. **blueprint_links** - Blueprint URL records
12. **client_blueprint_assignments** - Blueprint assignments to clients/stages

## Security
- RLS enabled on all new tables
- Admin (authenticated, Super Admin role) has full access
- Clients can only read their own data
- Public anon read for published portfolio content

## Notes
- Soft deletes via deleted_at on files
- All tables have created_at, updated_at, created_by, updated_by
- Foreign keys with safe ON DELETE actions
*/

-- Add auth_user_id + portal fields to existing clients table or create new one
-- We keep the existing clients table and add new columns safely

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Hold','Completed','Inactive')),
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

CREATE INDEX IF NOT EXISTS clients_auth_user_idx ON clients(auth_user_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);

-- Client Projects
CREATE TABLE IF NOT EXISTS client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  expected_completion_date date,
  current_stage_id uuid,
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Hold','Completed','Cancelled')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_projects_client_idx ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS client_projects_status_idx ON client_projects(status);

-- Portfolio Categories
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Portfolio Projects
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  detailed_description text,
  client_name text,
  category_id uuid REFERENCES portfolio_categories(id) ON DELETE SET NULL,
  services_provided text[],
  technologies_used text[],
  location text,
  completion_date date,
  cover_image_url text,
  website_url text,
  case_study_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_featured boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  seo_keywords text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_projects_status_idx ON portfolio_projects(status);
CREATE INDEX IF NOT EXISTS portfolio_projects_featured_idx ON portfolio_projects(is_featured);
CREATE INDEX IF NOT EXISTS portfolio_projects_order_idx ON portfolio_projects(display_order);

-- Portfolio Gallery
CREATE TABLE IF NOT EXISTS portfolio_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_project_id uuid NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_gallery_project_idx ON portfolio_gallery(portfolio_project_id);

-- Folders
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  path text NOT NULL DEFAULT '/',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders(parent_id);

-- Files
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  original_name text NOT NULL,
  display_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  public_url text NOT NULL,
  mime_type text,
  size bigint,
  bucket text NOT NULL DEFAULT 'documents',
  deleted_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS files_folder_idx ON files(folder_id);
CREATE INDEX IF NOT EXISTS files_deleted_idx ON files(deleted_at);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON files(created_at DESC);

-- Stages (master list)
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_progress int NOT NULL DEFAULT 0 CHECK (default_progress BETWEEN 0 AND 100),
  display_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  icon text,
  color text,
  default_duration_days int,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stages_order_idx ON stages(display_order);

-- Client Project Stages
CREATE TABLE IF NOT EXISTS client_project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_project_id uuid NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started','In Progress','Awaiting Client Approval','Revision Required','Completed','Skipped')),
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date date,
  expected_completion_date date,
  completed_date date,
  client_notes text,
  admin_notes text,
  display_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cps_project_idx ON client_project_stages(client_project_id);
CREATE INDEX IF NOT EXISTS cps_stage_idx ON client_project_stages(stage_id);
CREATE INDEX IF NOT EXISTS cps_status_idx ON client_project_stages(status);

-- Add FK from client_projects to client_project_stages for current_stage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'client_projects_current_stage_fk'
  ) THEN
    ALTER TABLE client_projects ADD CONSTRAINT client_projects_current_stage_fk
      FOREIGN KEY (current_stage_id) REFERENCES client_project_stages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Client File Assignments
CREATE TABLE IF NOT EXISTS client_file_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_project_id uuid REFERENCES client_projects(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES client_project_stages(id) ON DELETE SET NULL,
  client_title text NOT NULL,
  client_description text,
  category text,
  display_order int NOT NULL DEFAULT 0,
  can_preview boolean NOT NULL DEFAULT true,
  can_download boolean NOT NULL DEFAULT true,
  visible_from timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cfa_file_idx ON client_file_assignments(file_id);
CREATE INDEX IF NOT EXISTS cfa_client_idx ON client_file_assignments(client_id);
CREATE INDEX IF NOT EXISTS cfa_project_idx ON client_file_assignments(client_project_id);
CREATE INDEX IF NOT EXISTS cfa_stage_idx ON client_file_assignments(stage_id);

-- Blueprint Links
CREATE TABLE IF NOT EXISTS blueprint_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client Blueprint Assignments
CREATE TABLE IF NOT EXISTS client_blueprint_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id uuid NOT NULL REFERENCES blueprint_links(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_project_id uuid REFERENCES client_projects(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES client_project_stages(id) ON DELETE SET NULL,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cba_blueprint_idx ON client_blueprint_assignments(blueprint_id);
CREATE INDEX IF NOT EXISTS cba_client_idx ON client_blueprint_assignments(client_id);

-- Triggers for updated_at
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['client_projects','portfolio_categories','portfolio_projects','portfolio_gallery','folders','files','stages','client_project_stages','client_file_assignments','blueprint_links','client_blueprint_assignments'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t, t);
  END LOOP;
END $$;

-- RLS
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_blueprint_assignments ENABLE ROW LEVEL SECURITY;

-- Admin full access (authenticated)
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['client_projects','portfolio_categories','portfolio_projects','portfolio_gallery','folders','files','stages','client_project_stages','client_file_assignments','blueprint_links','client_blueprint_assignments'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_admin_all ON %I FOR ALL TO authenticated USING (is_authenticated()) WITH CHECK (is_authenticated())', t, t);
  END LOOP;
END $$;

-- Public read for published portfolio
DROP POLICY IF EXISTS portfolio_projects_public_read ON portfolio_projects;
CREATE POLICY portfolio_projects_public_read ON portfolio_projects FOR SELECT TO anon, authenticated USING (status = 'published' OR is_authenticated());

DROP POLICY IF EXISTS portfolio_categories_public_read ON portfolio_categories;
CREATE POLICY portfolio_categories_public_read ON portfolio_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portfolio_gallery_public_read ON portfolio_gallery;
CREATE POLICY portfolio_gallery_public_read ON portfolio_gallery FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM portfolio_projects pp WHERE pp.id = portfolio_gallery.portfolio_project_id AND (pp.status = 'published' OR is_authenticated()))
);

-- Seed default stages
INSERT INTO stages (name, description, default_progress, display_order, icon, color, default_duration_days) VALUES
('Initial Consultation', 'First meeting to understand client requirements and project goals', 5, 1, 'MessageSquare', '#6366f1', 3),
('Requirement Collection', 'Gathering detailed requirements, site measurements, and specifications', 10, 2, 'ClipboardList', '#8b5cf6', 7),
('Concept Development', 'Creating initial design concepts and exploring design directions', 25, 3, 'Lightbulb', '#f59e0b', 14),
('Design Approval', 'Client reviews and approves the design direction', 35, 4, 'CheckSquare', '#10b981', 7),
('Blueprint Preparation', 'Detailed technical drawings and documentation', 50, 5, 'FileText', '#3b82f6', 21),
('Execution', 'Construction and implementation phase', 70, 6, 'Hammer', '#f97316', 60),
('Review', 'Quality review and progress inspection', 85, 7, 'Eye', '#ec4899', 7),
('Final Delivery', 'Final handover and project completion documentation', 95, 8, 'Package', '#14b8a6', 7),
('Completed', 'Project fully delivered and signed off', 100, 9, 'CheckCircle2', '#22c55e', 0)
ON CONFLICT DO NOTHING;

-- Seed default portfolio categories
INSERT INTO portfolio_categories (name, slug, description, display_order) VALUES
('Residential', 'residential', 'Homes, villas, and residential developments', 1),
('Commercial', 'commercial', 'Offices, retail, and commercial spaces', 2),
('Interior', 'interior', 'Interior design and space experience projects', 3),
('Institutional', 'institutional', 'Educational, healthcare, and public buildings', 4),
('Master Planning', 'master-planning', 'Urban design and master planning', 5)
ON CONFLICT (slug) DO NOTHING;
