-- Four editable starter projects for the public portfolio.
-- Existing projects with the same slug are left untouched so later admin edits
-- are never overwritten when migrations are replayed.

insert into portfolio_categories (name, slug, description, display_order)
values
  ('Residential', 'residential', 'Homes, villas, and residential developments', 1),
  ('Commercial', 'commercial', 'Offices, retail, and commercial spaces', 2),
  ('Interior', 'interior', 'Interior design and space experience projects', 3)
on conflict (slug) do nothing;

insert into portfolio_projects (
  title,
  slug,
  short_description,
  detailed_description,
  client_name,
  category_id,
  services_provided,
  technologies_used,
  location,
  completion_date,
  cover_image_url,
  status,
  is_featured,
  display_order,
  seo_title,
  seo_description,
  seo_keywords
)
select
  'Chamundi Hill Residence',
  'chamundi-hill-residence',
  'A contemporary family residence shaped around natural light, framed views, and warm material finishes.',
  'Set along the Chamundi Hill corridor, this residence balances privacy with openness. Deep overhangs, shaded courts, cross ventilation, and a restrained natural palette create a calm home that responds thoughtfully to Mysuru''s climate.',
  'Private Residential Client',
  id,
  array['Architecture', 'Space Planning', 'BIM Coordination', 'Construction Documentation'],
  array['BIM', 'Passive Design', '3D Visualization'],
  'Chamundi Hill Road, Mysuru',
  date '2025-12-12',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85',
  'published',
  true,
  1,
  'Chamundi Hill Residence | AMK Architects',
  'A climate-responsive contemporary residence designed by AMK Architects in Mysuru.',
  'residential architecture, contemporary home, Mysuru architect'
from portfolio_categories
where slug = 'residential'
on conflict (slug) do nothing;

insert into portfolio_projects (
  title,
  slug,
  short_description,
  detailed_description,
  client_name,
  category_id,
  services_provided,
  technologies_used,
  location,
  completion_date,
  cover_image_url,
  status,
  is_featured,
  display_order,
  seo_title,
  seo_description,
  seo_keywords
)
select
  'Vijayanagar Courtyard Home',
  'vijayanagar-courtyard-home',
  'A courtyard-led urban home with shaded transitions and a seamless indoor-outdoor living experience.',
  'The home is organized around a planted central court that draws daylight into the plan while maintaining privacy from the street. Layered thresholds, tactile finishes, and carefully framed landscape views make compact urban living feel generous.',
  'Private Residential Client',
  id,
  array['Architecture', 'Interior Design', 'Landscape Integration', 'Execution Support'],
  array['BIM', 'Daylight Study', 'Material Visualization'],
  'Vijayanagar, Mysuru',
  date '2026-03-28',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85',
  'published',
  true,
  2,
  'Vijayanagar Courtyard Home | AMK Architects',
  'A contemporary courtyard residence with integrated architecture and interiors in Mysuru.',
  'courtyard house, villa design, residential interiors, Mysuru'
from portfolio_categories
where slug = 'residential'
on conflict (slug) do nothing;

insert into portfolio_projects (
  title,
  slug,
  short_description,
  detailed_description,
  client_name,
  category_id,
  services_provided,
  technologies_used,
  location,
  completion_date,
  cover_image_url,
  status,
  is_featured,
  display_order,
  seo_title,
  seo_description,
  seo_keywords
)
select
  'Hebbal Workspace Studio',
  'hebbal-workspace-studio',
  'A flexible commercial workplace designed for collaboration, focused work, and abundant daylight.',
  'This compact studio uses modular planning to support changing team sizes and multiple modes of work. Transparent meeting rooms, shared project tables, acoustic zones, and a warm material palette create a professional environment without losing character.',
  'Commercial Client',
  id,
  array['Workplace Strategy', 'Architecture', 'Interior Design', 'MEP Coordination'],
  array['BIM', 'Space Utilization Study', 'Lighting Simulation'],
  'Hebbal Industrial Area, Mysuru',
  date '2026-01-20',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85',
  'published',
  true,
  3,
  'Hebbal Workspace Studio | AMK Architects',
  'A flexible daylight-filled commercial workplace designed by AMK Architects in Mysuru.',
  'office interior, commercial architecture, workplace design, Mysuru'
from portfolio_categories
where slug = 'commercial'
on conflict (slug) do nothing;

insert into portfolio_projects (
  title,
  slug,
  short_description,
  detailed_description,
  client_name,
  category_id,
  services_provided,
  technologies_used,
  location,
  completion_date,
  cover_image_url,
  status,
  is_featured,
  display_order,
  seo_title,
  seo_description,
  seo_keywords
)
select
  'Saraswathipuram Interior Upgrade',
  'saraswathipuram-interior-upgrade',
  'A refined residential interior shaped by custom storage, layered lighting, and a calm material palette.',
  'The renovation reworks an existing apartment into a brighter, more efficient home. Bespoke joinery consolidates storage, indirect lighting softens the rooms, and a consistent timber-and-stone palette connects the living, dining, and private spaces.',
  'Private Interior Client',
  id,
  array['Interior Design', 'Custom Furniture', 'Lighting Design', 'Site Coordination'],
  array['3D Visualization', 'Joinery Detailing', 'Material Specification'],
  'Saraswathipuram, Mysuru',
  date '2026-05-06',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85',
  'published',
  true,
  4,
  'Saraswathipuram Interior Upgrade | AMK Architects',
  'A warm contemporary residential interior renovation by AMK Architects in Mysuru.',
  'residential interior, apartment renovation, custom furniture, Mysuru'
from portfolio_categories
where slug = 'interior'
on conflict (slug) do nothing;

insert into portfolio_gallery (portfolio_project_id, image_url, caption, display_order)
select project.id, gallery.image_url, gallery.caption, gallery.display_order
from portfolio_projects project
join lateral (
  values
    ('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85', 'Street elevation', 1),
    ('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85', 'Living space', 2),
    ('https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1800&q=85', 'Material details', 3)
) as gallery(image_url, caption, display_order) on true
where project.slug = 'chamundi-hill-residence'
  and not exists (
    select 1 from portfolio_gallery existing
    where existing.portfolio_project_id = project.id and existing.image_url = gallery.image_url
  );

insert into portfolio_gallery (portfolio_project_id, image_url, caption, display_order)
select project.id, gallery.image_url, gallery.caption, gallery.display_order
from portfolio_projects project
join lateral (
  values
    ('https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1800&q=85', 'Courtyard connection', 1),
    ('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1800&q=85', 'Living and dining', 2),
    ('https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1800&q=85', 'Natural material palette', 3)
) as gallery(image_url, caption, display_order) on true
where project.slug = 'vijayanagar-courtyard-home'
  and not exists (
    select 1 from portfolio_gallery existing
    where existing.portfolio_project_id = project.id and existing.image_url = gallery.image_url
  );

insert into portfolio_gallery (portfolio_project_id, image_url, caption, display_order)
select project.id, gallery.image_url, gallery.caption, gallery.display_order
from portfolio_projects project
join lateral (
  values
    ('https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85', 'Open workplace', 1),
    ('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=85', 'Collaboration zone', 2),
    ('https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=85', 'Team studio', 3)
) as gallery(image_url, caption, display_order) on true
where project.slug = 'hebbal-workspace-studio'
  and not exists (
    select 1 from portfolio_gallery existing
    where existing.portfolio_project_id = project.id and existing.image_url = gallery.image_url
  );

insert into portfolio_gallery (portfolio_project_id, image_url, caption, display_order)
select project.id, gallery.image_url, gallery.caption, gallery.display_order
from portfolio_projects project
join lateral (
  values
    ('https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1800&q=85', 'Living room', 1),
    ('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1800&q=85', 'Dining and material palette', 2),
    ('https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1800&q=85', 'Custom joinery', 3)
) as gallery(image_url, caption, display_order) on true
where project.slug = 'saraswathipuram-interior-upgrade'
  and not exists (
    select 1 from portfolio_gallery existing
    where existing.portfolio_project_id = project.id and existing.image_url = gallery.image_url
  );
