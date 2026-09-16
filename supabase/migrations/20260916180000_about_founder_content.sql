/* Make all founder-card content manageable from the About Us CMS editor. */

alter table website_pages
  add column if not exists founder_name text,
  add column if not exists founder_roles text,
  add column if not exists founder_bio text,
  add column if not exists founder_statement text;

update website_pages
set
  founder_name = coalesce(founder_name, 'Ar. Andra Manoj Kumar'),
  founder_roles = coalesce(founder_roles, 'Architect | Computational Designer | BIM Specialist | Architectural Photographer'),
  founder_bio = coalesce(founder_bio, 'The studio is shaped around design clarity, BIM coordination, realistic visualization, and construction-ready decision making.'),
  founder_statement = coalesce(founder_statement, 'Architecture today demands more than drawings. It requires technology, data, visualization, and execution expertise working together. AMK creates spaces that are intelligent, efficient, sustainable, and timeless.')
where slug = 'about';
