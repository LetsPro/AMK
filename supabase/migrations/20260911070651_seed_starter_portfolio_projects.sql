/*
# Seed four editable starter portfolio projects

1. Data Inserted
- Three portfolio categories: Residential, Commercial, Interior (with display ordering).
- Two published, featured portfolio projects:
  - "Chamundi Hill Residence" (Residential category) — climate-responsive contemporary residence.
  - "Vijayanagar Courtyard Home" (Residential category) — courtyard-led urban home.
- Additional projects (third and fourth) were partially provided and will be added in a follow-up migration.

2. Idempotency
- Category inserts use ON CONFLICT (slug) DO NOTHING — existing categories are never overwritten.
- Project inserts use ON CONFLICT (slug) DO NOTHING — admin edits to existing projects are preserved when migrations are replayed.

3. Security
- No RLS or policy changes — existing access controls remain unchanged.

4. Important Notes
- Cover images use Unsplash URLs as placeholders; admins can replace them via the CMS.
- All projects are published and featured so they appear immediately on the public portfolio.
- The category_id is resolved via a subquery on portfolio_categories by slug, so the insert works regardless of the actual UUID assigned to each category.
*/

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
