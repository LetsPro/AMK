insert into services(name, slug, description, image_url, price_from, status) values
('Architectural Design', 'architectural-design', 'Concept planning, floor plans, elevations, working drawings, and design coordination for homes and commercial spaces in Mysuru.', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80', 75000, 'published'),
('Approval Drawings', 'approval-drawings', 'Municipal approval drawings, documentation support, and submission-ready technical packages for Mysuru and Karnataka projects.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80', 35000, 'published'),
('Structural Engineering', 'structural-engineering', 'Structural design coordination, site-responsive engineering inputs, and construction-ready technical documentation.', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', 55000, 'published')
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
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    location = excluded.location,
    status = excluded.status,
    budget = excluded.budget,
    progress = excluded.progress,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    cover_image_url = excluded.cover_image_url,
    published = excluded.published,
    updated_at = now();

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
select 'Raghavendra Rao', 'Chamundi Hill Residence', 'AMK translated our requirements into a practical, elegant home design and kept every drawing revision clearly documented.', 5, null, true
where not exists (select 1 from testimonials where name = 'Raghavendra Rao' and company = 'Chamundi Hill Residence');
insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Nandini Prakash', 'Vijayanagar Courtyard Home', 'The team handled design, approvals, and site coordination with a professional process. Communication was consistent from start to finish.', 5, null, true
where not exists (select 1 from testimonials where name = 'Nandini Prakash' and company = 'Vijayanagar Courtyard Home');
insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Mohammed Irfan', 'Hebbal Workspace Studio', 'Our workspace plan was delivered with clear cost visibility and fast revisions. The Mysuru site constraints were handled well.', 4, null, true
where not exists (select 1 from testimonials where name = 'Mohammed Irfan' and company = 'Hebbal Workspace Studio');
