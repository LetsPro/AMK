/*
# Seed Mysuru Demo Content

Seeds demo content for the AMK Architects & Engineers platform:
- 3 hero banners with Unsplash architecture imagery
- 8 published services (Architecture, Interior, BIM, Parametric, Engineering, Visualization, 3D Printing, Project Management)
- 4 demo projects in Mysuru with realistic budgets, progress, and dates
- 6 gallery images linked to projects
- 3 published testimonials
All inserts are idempotent using ON CONFLICT / NOT EXISTS guards.
*/

insert into banners(title, subtitle, image_url, cta_label, cta_url, is_active) values
('Beyond Buildings. We Design Experiences.', 'Technology-driven architecture and engineering studio in Mysuru creating intelligent, sustainable, and future-ready spaces.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80', 'Start a Project', '/contact', true),
('Where Architecture Meets Innovation', 'Architecture, engineering, BIM workflows, parametric design, visualization, and execution support from concept to completion.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80', 'View Projects', '/projects', true),
('Designing Tomorrow. Building Beyond.', 'From luxury residences and commercial spaces to healthcare, hospitality, institutional, and large-scale development projects.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80', 'Get Started', '/customer-register', true)
on conflict do nothing;

insert into services(name, slug, description, image_url, price_from, status) values
('Architecture & Master Planning', 'architecture-master-planning', 'Luxury residences, villas, apartments, commercial buildings, healthcare, hospitality, institutional, mixed-use, urban design, and master planning solutions.', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80', 75000, 'published'),
('Interior Design & Space Experience', 'interior-design-space-experience', 'Residential interiors, corporate offices, retail environments, hospitality interiors, space planning, custom furniture, and material selection.', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80', 65000, 'published'),
('BIM & Digital Engineering', 'bim-digital-engineering', 'BIM modelling, documentation, clash detection, construction documentation, quantity extraction, shop drawings, and digital project coordination.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80', 55000, 'published'),
('Parametric & Computational Design', 'parametric-computational-design', 'Parametric facade design, complex geometry development, performance-based design, digital form finding, and generative design workflows.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', 85000, 'published'),
('Engineering Solutions', 'engineering-solutions', 'Structural coordination, electrical design, plumbing design, storm water management, infrastructure planning, and utility coordination.', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', 55000, 'published'),
('Visualization & Digital Experiences', 'visualization-digital-experiences', 'Photorealistic renderings, walkthrough animations, virtual reality experiences, marketing visuals, drone mapping, and site analysis.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', 45000, 'published'),
('3D Printing & Digital Fabrication', '3d-printing-digital-fabrication', '3D printed buildings, 3D printed furniture, architectural prototyping, design mockups, models, and digital fabrication solutions.', 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80', 90000, 'published'),
('Project Management & Execution Support', 'project-management-execution-support', 'Site supervision, contractor coordination, quality assurance, cost monitoring, construction management, and technical site support.', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80', 70000, 'published')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    price_from = excluded.price_from,
    status = excluded.status,
    updated_at = now();

insert into projects(name, slug, description, category, location, status, budget, progress, start_date, end_date, cover_image_url, published) values
('Chamundi Hill Residence', 'chamundi-hill-residence', 'A contemporary family residence planned for natural ventilation, framed views, and warm material finishes near the Chamundi Hill corridor.', 'Residential', 'Chamundi Hill Road, Mysuru, Karnataka, India', 'Design', 8500000, 62, current_date - interval '110 days', current_date + interval '90 days', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', true),
('Vijayanagar Courtyard Home', 'vijayanagar-courtyard-home', 'A courtyard-led home design with shaded transitions, efficient planning, and a strong indoor-outdoor living relationship.', 'Residential', 'Vijayanagar, Mysuru, Karnataka, India', 'Execution', 11200000, 78, current_date - interval '180 days', current_date + interval '45 days', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', true),
('Hebbal Workspace Studio', 'hebbal-workspace-studio', 'A compact commercial studio designed for flexible workstations, client meetings, daylight, and phased interior execution.', 'Commercial', 'Hebbal Industrial Area, Mysuru, Karnataka, India', 'Approval', 4200000, 44, current_date - interval '70 days', current_date + interval '120 days', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80', true),
('Saraswathipuram Interior Upgrade', 'saraswathipuram-interior-upgrade', 'Residential interior planning with custom storage, lighting upgrades, material palettes, and execution coordination.', 'Interior', 'Saraswathipuram, Mysuru, Karnataka, India', 'Completed', 2800000, 100, current_date - interval '240 days', current_date - interval '20 days', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', true)
on conflict (slug) do update
set name = excluded.name, description = excluded.description, category = excluded.category,
    location = excluded.location, status = excluded.status, budget = excluded.budget,
    progress = excluded.progress, start_date = excluded.start_date, end_date = excluded.end_date,
    cover_image_url = excluded.cover_image_url, published = excluded.published, updated_at = now();

insert into gallery(title, image_url, category, project_id, is_featured)
select 'Chamundi Hill Residence - Front Elevation', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 'Residential', p.id, true from projects p where p.slug = 'chamundi-hill-residence' and not exists (select 1 from gallery where title = 'Chamundi Hill Residence - Front Elevation');
insert into gallery(title, image_url, category, project_id, is_featured)
select 'Vijayanagar Courtyard Home - Living Court', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 'Residential', p.id, true from projects p where p.slug = 'vijayanagar-courtyard-home' and not exists (select 1 from gallery where title = 'Vijayanagar Courtyard Home - Living Court');
insert into gallery(title, image_url, category, project_id, is_featured)
select 'Hebbal Workspace Studio - Open Office', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80', 'Commercial', p.id, true from projects p where p.slug = 'hebbal-workspace-studio' and not exists (select 1 from gallery where title = 'Hebbal Workspace Studio - Open Office');
insert into gallery(title, image_url, category, project_id, is_featured)
select 'Saraswathipuram Interior Upgrade - Dining', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 'Interior', p.id, true from projects p where p.slug = 'saraswathipuram-interior-upgrade' and not exists (select 1 from gallery where title = 'Saraswathipuram Interior Upgrade - Dining');
insert into gallery(title, image_url, category, project_id, is_featured)
select 'Mysuru Material Palette Study', 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=80', 'Materials', null, false where not exists (select 1 from gallery where title = 'Mysuru Material Palette Study');
insert into gallery(title, image_url, category, project_id, is_featured)
select 'Approval Drawing Review', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80', 'Documentation', null, false where not exists (select 1 from gallery where title = 'Approval Drawing Review');

insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Homeowner, Mysuru', 'Residential Client', 'From the initial concept to the final design, the AMK team demonstrated exceptional creativity, professionalism, and technical expertise.', 5, null, true
where not exists (select 1 from testimonials where name = 'Homeowner, Mysuru' and company = 'Residential Client');
insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Commercial Property Owner', 'Commercial Client', 'AMK Architects & Engineers delivered a well-planned commercial project that balanced design, efficiency, and investment value.', 5, null, true
where not exists (select 1 from testimonials where name = 'Commercial Property Owner' and company = 'Commercial Client');
insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Real Estate Developer', 'Development Client', 'Their expertise in planning, engineering coordination, and project execution gave us complete confidence throughout the project.', 5, null, true
where not exists (select 1 from testimonials where name = 'Real Estate Developer' and company = 'Development Client');
