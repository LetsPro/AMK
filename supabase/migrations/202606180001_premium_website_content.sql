update banners
set title = 'Beyond Buildings. We Design Experiences.',
    subtitle = 'Technology-driven architecture and engineering studio in Mysuru creating intelligent, sustainable, and future-ready spaces.',
    cta_label = 'Start a Project',
    cta_url = '/contact',
    is_active = true,
    updated_at = now()
where title = 'AMK Architects & Engineers';

update banners
set title = 'Where Architecture Meets Innovation',
    subtitle = 'Architecture, engineering, BIM workflows, parametric design, visualization, and execution support from concept to completion.',
    cta_label = 'View Projects',
    cta_url = '/projects',
    is_active = true,
    updated_at = now()
where title = 'Design-Led Homes in Mysuru';

update banners
set title = 'Designing Tomorrow. Building Beyond.',
    subtitle = 'From luxury residences and commercial spaces to healthcare, hospitality, institutional, and large-scale development projects.',
    cta_label = 'Get Started',
    cta_url = '/customer-register',
    is_active = true,
    updated_at = now()
where title = 'Approvals, Billing, Projects, Support';

insert into banners(title, subtitle, image_url, cta_label, cta_url, is_active)
select 'Beyond Buildings. We Design Experiences.', 'Technology-driven architecture and engineering studio in Mysuru creating intelligent, sustainable, and future-ready spaces.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80', 'Start a Project', '/contact', true
where not exists (select 1 from banners where title = 'Beyond Buildings. We Design Experiences.');

insert into banners(title, subtitle, image_url, cta_label, cta_url, is_active)
select 'Where Architecture Meets Innovation', 'Architecture, engineering, BIM workflows, parametric design, visualization, and execution support from concept to completion.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80', 'View Projects', '/projects', true
where not exists (select 1 from banners where title = 'Where Architecture Meets Innovation');

insert into banners(title, subtitle, image_url, cta_label, cta_url, is_active)
select 'Designing Tomorrow. Building Beyond.', 'From luxury residences and commercial spaces to healthcare, hospitality, institutional, and large-scale development projects.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80', 'Get Started', '/customer-register', true
where not exists (select 1 from banners where title = 'Designing Tomorrow. Building Beyond.');

update services
set name = 'Architecture & Master Planning',
    description = 'Luxury residences, villas, apartments, commercial buildings, healthcare, hospitality, institutional, mixed-use, urban design, and master planning solutions.',
    image_url = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    price_from = 75000,
    status = 'published',
    updated_at = now()
where slug = 'architectural-design';

update services
set name = 'BIM & Digital Engineering',
    description = 'BIM modelling, documentation, clash detection, construction documentation, quantity extraction, shop drawings, and digital project coordination.',
    image_url = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    price_from = 55000,
    status = 'published',
    updated_at = now()
where slug = 'approval-drawings';

update services
set name = 'Engineering Solutions',
    description = 'Structural coordination, electrical design, plumbing design, storm water management, infrastructure planning, and utility coordination.',
    image_url = 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    price_from = 55000,
    status = 'published',
    updated_at = now()
where slug = 'structural-engineering';

insert into services(name, slug, description, image_url, price_from, status) values
('Interior Design & Space Experience', 'interior-design-space-experience', 'Residential interiors, corporate offices, retail environments, hospitality interiors, space planning, custom furniture, and material selection.', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80', 65000, 'published'),
('Parametric & Computational Design', 'parametric-computational-design', 'Parametric facade design, complex geometry development, performance-based design, digital form finding, and generative design workflows.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', 85000, 'published'),
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

update testimonials
set name = 'Homeowner, Mysuru',
    company = 'Residential Client',
    quote = 'From the initial concept to the final design, the AMK team demonstrated exceptional creativity, professionalism, and technical expertise.',
    rating = 5,
    is_published = true,
    updated_at = now()
where name = 'Raghavendra Rao' and company = 'Chamundi Hill Residence';

update testimonials
set name = 'Commercial Property Owner',
    company = 'Commercial Client',
    quote = 'AMK Architects & Engineers delivered a well-planned commercial project that balanced design, efficiency, and investment value.',
    rating = 5,
    is_published = true,
    updated_at = now()
where name = 'Nandini Prakash' and company = 'Vijayanagar Courtyard Home';

update testimonials
set name = 'Real Estate Developer',
    company = 'Development Client',
    quote = 'Their expertise in planning, engineering coordination, and project execution gave us complete confidence throughout the project.',
    rating = 5,
    is_published = true,
    updated_at = now()
where name = 'Mohammed Irfan' and company = 'Hebbal Workspace Studio';

insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Homeowner, Mysuru', 'Residential Client', 'From the initial concept to the final design, the AMK team demonstrated exceptional creativity, professionalism, and technical expertise.', 5, null, true
where not exists (select 1 from testimonials where name = 'Homeowner, Mysuru' and company = 'Residential Client');

insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Commercial Property Owner', 'Commercial Client', 'AMK Architects & Engineers delivered a well-planned commercial project that balanced design, efficiency, and investment value.', 5, null, true
where not exists (select 1 from testimonials where name = 'Commercial Property Owner' and company = 'Commercial Client');

insert into testimonials(name, company, quote, rating, avatar_url, is_published)
select 'Real Estate Developer', 'Development Client', 'Their expertise in planning, engineering coordination, and project execution gave us complete confidence throughout the project.', 5, null, true
where not exists (select 1 from testimonials where name = 'Real Estate Developer' and company = 'Development Client');
