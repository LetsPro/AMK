import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Eye, Layers3, MapPin, Ruler, Send, ShieldCheck, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-14"><h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>{children}</section>;
}

function Seo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [description, title]);
  return null;
}

type PublicProject = { id: string; name: string; slug?: string; description?: string | null; category?: string | null; location?: string | null; cover_image_url?: string | null; progress?: number | null; status?: string | null; budget?: number | null };
type PublicGallery = { id: string; title: string; category?: string | null; image_url: string; description?: string | null };

const demoServices = [
  { id: "demo-service-1", name: "Architecture & Master Planning", slug: "architecture-master-planning", description: "Luxury residences, villas, apartments, commercial buildings, healthcare, hospitality, institutional, mixed-use, urban design, and master planning solutions.", image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-2", name: "Interior Design & Space Experience", slug: "interior-design-space-experience", description: "Residential interiors, corporate offices, retail environments, hospitality interiors, space planning, custom furniture, and material selection.", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-3", name: "BIM & Digital Engineering", slug: "bim-digital-engineering", description: "BIM modelling, documentation, clash detection, construction documentation, quantity extraction, shop drawings, and digital project coordination.", image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-4", name: "Parametric & Computational Design", slug: "parametric-computational-design", description: "Parametric facade design, complex geometry development, performance-based design, digital form finding, and generative design workflows.", image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-5", name: "Engineering Solutions", slug: "engineering-solutions", description: "Structural coordination, electrical design, plumbing design, storm water management, infrastructure planning, and utility coordination.", image_url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-6", name: "Visualization & Digital Experiences", slug: "visualization-digital-experiences", description: "Photorealistic renderings, walkthrough animations, virtual reality experiences, marketing visuals, drone mapping, and site analysis.", image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-7", name: "3D Printing & Digital Fabrication", slug: "3d-printing-digital-fabrication", description: "3D printed buildings, 3D printed furniture, architectural prototyping, design mockups, models, and digital fabrication solutions.", image_url: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-8", name: "Project Management & Execution Support", slug: "project-management-execution-support", description: "Site supervision, contractor coordination, quality assurance, cost monitoring, construction management, and technical site support.", image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80" }
];

const demoProjects = [
  { id: "demo-project-1", name: "Chamundi Hill Residence", slug: "chamundi-hill-residence", description: "A contemporary family residence planned for natural ventilation, framed views, and warm material finishes.", category: "Residential", location: "Chamundi Hill Road, Mysuru, Karnataka, India", cover_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-project-2", name: "Vijayanagar Courtyard Home", slug: "vijayanagar-courtyard-home", description: "A courtyard-led home with shaded transitions, efficient planning, and indoor-outdoor living.", category: "Residential", location: "Vijayanagar, Mysuru, Karnataka, India", cover_image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-project-3", name: "Hebbal Workspace Studio", slug: "hebbal-workspace-studio", description: "A compact commercial studio designed for flexible workstations, client meetings, and daylight.", category: "Commercial", location: "Hebbal Industrial Area, Mysuru, Karnataka, India", cover_image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80" }
];

const demoGallery = [
  { id: "demo-gallery-1", title: "Chamundi Hill Residence - Front Elevation", category: "Residential", image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-gallery-2", title: "Vijayanagar Courtyard Home - Living Court", category: "Residential", image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-gallery-3", title: "Hebbal Workspace Studio - Open Office", category: "Commercial", image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-gallery-4", title: "Saraswathipuram Interior Upgrade - Dining", category: "Interior", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-gallery-5", title: "Mysuru Material Palette Study", category: "Materials", image_url: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=80" },
  { id: "demo-gallery-6", title: "Approval Drawing Review", category: "Documentation", image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80" }
];

const demoTestimonials = [
  { id: "demo-testimonial-1", name: "Homeowner, Mysuru", company: "Residential Client", quote: "From the initial concept to the final design, the AMK team demonstrated exceptional creativity, professionalism, and technical expertise." },
  { id: "demo-testimonial-2", name: "Commercial Property Owner", company: "Commercial Client", quote: "AMK Architects & Engineers delivered a well-planned commercial project that balanced design, efficiency, and investment value." },
  { id: "demo-testimonial-3", name: "Real Estate Developer", company: "Development Client", quote: "Their expertise in planning, engineering coordination, and project execution gave us complete confidence throughout the project." }
];

const demoBanners = [
  {
    id: "demo-banner-1",
    title: "Beyond Buildings. We Design Experiences.",
    subtitle: "Technology-driven architecture and engineering studio in Mysuru creating intelligent, sustainable, and future-ready spaces.",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80",
    cta_label: "Start a Project",
    cta_url: "/contact"
  },
  {
    id: "demo-banner-2",
    title: "Where Architecture Meets Innovation",
    subtitle: "Architecture, engineering, BIM workflows, parametric design, visualization, and execution support from concept to completion.",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80",
    cta_label: "View Projects",
    cta_url: "/projects"
  },
  {
    id: "demo-banner-3",
    title: "Designing Tomorrow. Building Beyond.",
    subtitle: "From luxury residences and commercial spaces to healthcare, hospitality, institutional, and large-scale development projects.",
    image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80",
    cta_label: "Get Started",
    cta_url: "/customer-register"
  }
];

function ProjectModal({ project, onClose }: { project: PublicProject; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="relative">
          <div className="aspect-[16/8] bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${project.cover_image_url ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"})` }} />
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow" onClick={onClose} aria-label="Close project"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-brand-primary">{project.category ?? "Architecture Project"}</div>
            <h2 className="mt-2 text-3xl font-black">{project.name}</h2>
            <p className="mt-4 leading-7 text-slate-600">{project.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Architecture", "Engineering", "Approvals"].map((item) => <div key={item} className="rounded-md bg-orange-50 p-4 text-sm font-semibold text-slate-700">{item}</div>)}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-5">
            <h3 className="font-bold">Project Snapshot</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-brand-primary" />{project.location ?? "Mysuru, Karnataka, India"}</p>
              <p><span className="font-semibold text-slate-900">Status:</span> {project.status ?? "Design"}</p>
              <p><span className="font-semibold text-slate-900">Progress:</span> {project.progress ?? 60}%</p>
              <p><span className="font-semibold text-slate-900">Scope:</span> Concept, drawings, approvals, technical coordination, and execution support.</p>
            </div>
            <Button className="mt-6 w-full" onClick={() => location.href = "/contact"}>Discuss Similar Project</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GalleryPreview({ item, onClose }: { item: PublicGallery; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div><h2 className="text-xl font-black">{item.title}</h2><p className="text-sm text-slate-500">{item.category}</p></div>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" onClick={onClose} aria-label="Close preview"><X className="h-5 w-5" /></button>
        </div>
        <img src={item.image_url} alt={item.title} className="max-h-[72vh] w-full object-contain bg-slate-950" />
      </motion.div>
    </div>
  );
}

export function HomePage() {
  const { data: services = [] } = useTable("services", { limit: 6, orderBy: "created_at", eq: { status: "published" } });
  const { data: projects = [] } = useTable("projects", { limit: 6, orderBy: "created_at", eq: { published: true } });
  const { data: testimonials = [] } = useTable("testimonials", { limit: 3, orderBy: "created_at", eq: { is_published: true } });
  const { data: banners = [] } = useTable("banners", { orderBy: "created_at", ascending: true, eq: { is_active: true } });
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const serviceRows = services.length ? services : demoServices;
  const projectRows = projects.length ? projects : demoProjects;
  const testimonialRows = testimonials.length ? testimonials : demoTestimonials;
  const bannerRows = banners.length ? banners : demoBanners;
  const slide = bannerRows[activeSlide % bannerRows.length];
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % bannerRows.length), 5500);
    return () => window.clearInterval(timer);
  }, [bannerRows.length]);
  const visibleProjects = [0, 1, 2].map((offset) => projectRows[(activeProjectIndex + offset) % projectRows.length]).filter(Boolean);
  return (
    <>
      <Seo title="AMK Architects & Engineers Mysuru | Technology-Driven Architecture Studio" description="AMK Architects & Engineers is a Mysuru architecture and engineering studio specializing in Architecture, BIM, Parametric Design, 3D Printed Buildings, Visualization, and Construction Solutions." />
      <section className="relative min-h-[620px] overflow-hidden bg-slate-950 px-4 py-20 text-white">
        {bannerRows.map((item, index) => (
          <motion.div
            key={item.id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: index === activeSlide ? 1 : 0, scale: index === activeSlide ? 1 : 1.04 }}
            transition={{ duration: 0.7 }}
            style={{ backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.92), rgba(15,23,42,0.52), rgba(15,23,42,0.18)), url(${item.image_url ?? demoBanners[0].image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}
        <div className="relative mx-auto flex min-h-[460px] max-w-7xl items-center">
          <div>
            <motion.h1 key={slide.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">{slide.title}</motion.h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-200">{slide.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => location.href = slide.cta_url ?? "/contact"}>{slide.cta_label ?? "Start a Project"}</Button>
              <Button variant="secondary" onClick={() => location.href = "/projects"}>View Projects</Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {bannerRows.map((item, index) => (
            <button key={item.id} aria-label={`Go to slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "w-9 bg-brand-primary" : "w-2.5 bg-white/60"}`} />
          ))}
        </div>
      </section>
      <Section title="Our Design Process">
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            ["Discovery & Consultation", "We understand your vision, requirements, aspirations, site conditions, budget, and project goals before design begins."],
            ["Concept Design & Planning", "Ideas become site-responsive concepts through analysis, space planning, feasibility studies, and creative exploration."],
            ["Design Development & BIM", "Plans, elevations, 3D models, material studies, BIM coordination, and technical details are refined together."],
            ["Execution & Handover", "Drawings, approvals, site coordination, quality monitoring, and handover support keep the project aligned."]
          ].map(([title, text], index) => (
            <Card key={title} className="relative overflow-hidden">
              <div className="absolute right-4 top-4 text-5xl font-black text-orange-100">{index + 1}</div>
              <h3 className="relative text-lg font-bold">{title}</h3>
              <p className="relative mt-3 text-sm leading-6 text-slate-500">{text}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section title="End-to-End Design, Engineering & Construction Solutions">
        <div className="grid gap-5 md:grid-cols-3">{serviceRows.map((service) => <Card key={service.id}><CheckCircle2 className="mb-4 text-brand-primary" /><h3 className="font-bold">{service.name}</h3><p className="mt-2 text-sm text-slate-500">{service.description}</p></Card>)}</div>
      </Section>
      <Section title="Integrated Capabilities">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            [Ruler, "Architecture", "Functional, sustainable, and visually compelling environments for people and future possibilities."],
            [Layers3, "BIM Workflows", "Digital modelling and coordination that reduce conflicts and improve construction efficiency."],
            [ClipboardCheck, "Parametric Design", "Computational workflows for optimized facades, complex geometry, and performance-led forms."],
            [ShieldCheck, "Visualization", "Renderings, walkthroughs, VR, and digital reviews so clients can see it before it is built."]
          ].map(([Icon, title, text]) => (
            <Card key={String(title)}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-orange-100 text-brand-primary"><Icon className="h-6 w-6" /></div>
              <h3 className="font-bold">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{String(text)}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section title="Featured Projects">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="max-w-2xl text-sm leading-6 text-slate-500">Explore selected residential, commercial, and interior architecture projects in Mysuru. Click a project to view scope, location, and delivery details.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setActiveProjectIndex((current) => (current - 1 + projectRows.length) % projectRows.length)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => setActiveProjectIndex((current) => (current + 1) % projectRows.length)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {visibleProjects.map((project) => (
            <button key={project.id} className="text-left" onClick={() => setSelectedProject(project as PublicProject)}>
              <Card className="group overflow-hidden p-0">
                <div className="aspect-[4/3] bg-slate-200 bg-cover transition duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${project.cover_image_url ?? "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"})` }} />
                <div className="p-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-primary">{project.category}</div>
                  <h3 className="font-bold">{project.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{project.location}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">View details <ArrowRight className="h-4 w-4" /></span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Sectors We Serve">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Residential", "Luxury homes, villas, apartments, and gated communities designed around modern lifestyles."],
            ["Commercial", "Workspaces, retail developments, mixed-use projects, and business environments that support growth."],
            ["Healthcare", "Hospitals, clinics, diagnostic centers, and wellness facilities planned around efficiency and patient care."],
            ["Hospitality", "Hotels, resorts, restaurants, and experiential destinations designed to leave lasting impressions."],
            ["Institutional", "Educational campuses, public buildings, and community-focused developments."],
            ["Layout Development", "Master planning, land development, infrastructure design, and township planning solutions."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Creating Spaces. Building Trust.">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ["250+", "Projects Across South India"],
            ["675,000+", "Square Feet of Thoughtfully Designed Spaces"],
            ["Multi-Sector", "Residential, Commercial, and Institutional Expertise"],
            ["Complete Partner", "Architecture, Engineering, BIM, Visualization, and Execution"]
          ].map(([value, label]) => <Card key={label}><div className="text-4xl font-black text-brand-primary">{value}</div><div className="text-sm text-slate-500">{label}</div></Card>)}
        </div>
      </Section>
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">One Partner. Infinite Possibilities.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">Architecture, engineering, BIM, parametric design, 3D printing, visualization, and project management come together in one accountable process.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Architecture", "Engineering", "BIM", "Parametric Design", "3D Printing", "Visualization"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/5 p-4 text-sm font-semibold">{item}</div>
            ))}
          </div>
        </div>
      </section>
      <Section title="Client Testimonials">
        <div className="grid gap-5 md:grid-cols-3">{testimonialRows.map((item) => <Card key={item.id}><p className="text-slate-600">“{item.quote}”</p><div className="mt-4 font-bold">{item.name}</div><div className="text-sm text-slate-500">{item.company}</div></Card>)}</div>
      </Section>
      <ContactPage compact />
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  );
}

export function ListingPage({ type }: { type: "projects" | "services" | "gallery" | "about" }) {
  const table = type === "services" ? "services" : type === "gallery" ? "gallery" : "projects";
  const { data = [] } = useTable(table as never, { orderBy: "created_at" });
  const [filter, setFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [preview, setPreview] = useState<PublicGallery | null>(null);
  const fallbackRows = type === "services" ? demoServices : type === "gallery" ? demoGallery : demoProjects;
  const sourceRows = data.length ? data : fallbackRows;
  const rows = useMemo(() => sourceRows.filter((item: { name?: string; title?: string; category?: string }) => `${item.name ?? item.title ?? ""} ${item.category ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [sourceRows, filter]);
  if (type === "about") return (
    <>
      <Seo title="About AMK Architects & Engineers Mysuru | Architecture & Engineering Studio" description="Learn about AMK Architects & Engineers, a Mysuru architecture and engineering team delivering residential design, approval drawings, structural coordination, interiors, and project operations." />
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl text-sm font-bold uppercase tracking-wide text-brand-accent">About AMK</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">We do not just design buildings. We shape the future.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">AMK Architects & Engineers brings together architecture, engineering, computational design, BIM workflows, and advanced visualization to create projects that perform as beautifully as they look.</p>
        </div>
      </section>
      <Section title="Meet the Founder">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <div className="text-sm font-bold uppercase tracking-wide text-brand-primary">Founder</div>
            <h2 className="mt-2 text-3xl font-black">Ar. Andra Manoj Kumar</h2>
            <p className="mt-3 text-sm font-semibold text-slate-500">Architect | Computational Designer | BIM Specialist | Architectural Visualizer</p>
          </Card>
          <Card>
            <p className="text-lg leading-8 text-slate-600">Architecture today demands more than drawings. It requires technology, data, visualization, and execution expertise working together. AMK creates spaces that are intelligent, efficient, sustainable, and timeless.</p>
          </Card>
        </div>
      </Section>
      <Section title="What We Stand For">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Creativity", "Every project begins with purpose-led design thinking and a clear understanding of the client's vision."],
            ["Technology", "BIM, parametric design, digital fabrication, and visualization are integrated into the design process."],
            ["Performance", "Spaces are planned to inspire, function, endure, and deliver long-term value."]
          ].map(([title, text]) => <Card key={title}><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></Card>)}
        </div>
      </Section>
      <Section title="Our Mysuru Design Approach">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-80 rounded-lg bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80)" }} />
          <div className="space-y-5">
            {["Design should not only look exceptional; it should perform exceptionally.", "Every project evolves through collaboration, data-driven decision making, and technical expertise.", "From concept development and approvals to execution and delivery, AMK creates spaces that inspire, function, and endure."].map((item) => <div key={item} className="flex gap-3 rounded-lg border border-slate-200 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-primary" /><p className="text-sm leading-6 text-slate-600">{item}</p></div>)}
          </div>
        </div>
      </Section>
    </>
  );
  if (type === "projects") return (
    <>
      <Seo title="Architecture Projects in Mysuru | AMK Architects & Engineers Portfolio" description="View AMK Architects & Engineers project portfolio including Mysuru residences, commercial studios, interiors, approvals, and architecture project management." />
      <Section title="Projects in Mysuru">
        <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-500">Browse selected architecture and engineering projects across Mysuru, Karnataka. Use filters by project name or category and open each project for a detailed preview.</p>
        <Input className="mb-6 max-w-md" placeholder="Filter projects by name or category" value={filter} onChange={(event) => setFilter(event.target.value)} />
        <div className="grid gap-5 md:grid-cols-3">{rows.map((item) => {
          const project = item as PublicProject;
          return <button key={project.id} className="text-left" onClick={() => setSelectedProject(project)}><Card className="group overflow-hidden p-0"><div className="aspect-[4/3] bg-slate-200 bg-cover transition group-hover:scale-[1.03]" style={{ backgroundImage: `url(${project.cover_image_url ?? ""})` }} /><div className="p-5"><div className="text-xs font-bold uppercase tracking-wide text-brand-primary">{project.category}</div><h3 className="mt-2 font-bold">{project.name}</h3><p className="mt-2 text-sm text-slate-500">{project.location}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">Open project <Eye className="h-4 w-4" /></span></div></Card></button>;
        })}</div>
      </Section>
      <Section title="Project Delivery Includes">
        <div className="grid gap-5 md:grid-cols-4">{["Concept design", "Approval drawings", "Structural coordination", "Site execution support"].map((item) => <Card key={item}><h3 className="font-bold">{item}</h3><p className="mt-2 text-sm text-slate-500">Documented and tracked through AMK project operations.</p></Card>)}</div>
      </Section>
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  );
  if (type === "services") return (
    <>
      <Seo title="Architecture Services Mysuru | Design, Approval Drawings, Structural Coordination" description="AMK Architects & Engineers offers architectural design, approval drawings, structural coordination, interiors, project management, and documentation services in Mysuru." />
      <Section title="Architecture & Engineering Services">
        <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-500">AMK brings together architecture, engineering, technology, and innovation to deliver comprehensive solutions from concept to completion.</p>
        <div className="grid gap-5 md:grid-cols-3">{rows.map((item) => <Card key={item.id as string} className="p-0"><div className="aspect-[4/3] rounded-t-lg bg-cover bg-center" style={{ backgroundImage: `url(${(item as { image_url?: string }).image_url ?? ""})` }} /><div className="p-5"><h3 className="font-bold">{(item as { name?: string }).name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{(item as { description?: string }).description}</p></div></Card>)}</div>
      </Section>
      <Section title="How We Work">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{["Discovery & Consultation", "Concept Design & Planning", "Design Development & BIM", "Execution Support & Handover"].map((item, index) => <Card key={item}><div className="text-3xl font-black text-brand-primary">0{index + 1}</div><h3 className="mt-3 font-bold">{item}</h3></Card>)}</div>
      </Section>
    </>
  );
  if (type === "gallery") return (
    <>
      <Seo title="Architecture Gallery Mysuru | AMK Architects Project Albums" description="Explore AMK Architects & Engineers gallery albums featuring residential elevations, interiors, workspaces, material palettes, and approval drawing documentation from Mysuru projects." />
      <Section title="Project Gallery Albums">
        <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-500">Preview project albums from AMK Architects & Engineers. Browse by residential, commercial, interiors, material studies, and documentation categories.</p>
        <Input className="mb-6 max-w-md" placeholder="Filter gallery albums by title or category" value={filter} onChange={(event) => setFilter(event.target.value)} />
        <div className="grid gap-5 md:grid-cols-3">{rows.map((item) => {
          const gallery = item as PublicGallery;
          return <button key={gallery.id} className="text-left" onClick={() => setPreview(gallery)}><Card className="group overflow-hidden p-0"><div className="relative aspect-[4/3] bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${gallery.image_url})` }}><div className="absolute inset-0 grid place-items-center bg-slate-950/0 transition group-hover:bg-slate-950/35"><span className="scale-90 rounded-full bg-white px-4 py-2 text-sm font-bold opacity-0 transition group-hover:scale-100 group-hover:opacity-100">Preview Album</span></div></div><div className="p-5"><div className="text-xs font-bold uppercase tracking-wide text-brand-primary">{gallery.category}</div><h3 className="mt-2 font-bold">{gallery.title}</h3></div></Card></button>;
        })}</div>
      </Section>
      <Section title="Gallery Categories">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{["Residential", "Commercial", "Interior", "Documentation"].map((item) => <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-5 font-bold">{item}</div>)}</div>
      </Section>
      {preview && <GalleryPreview item={preview} onClose={() => setPreview(null)} />}
    </>
  );
  return (
    <Section title={type}>
      <Input className="mb-6 max-w-md" placeholder="Filter by name or category" value={filter} onChange={(event) => setFilter(event.target.value)} />
      <div className="grid gap-5 md:grid-cols-3">{rows.length ? rows.map((item: { id: string; name?: string; title?: string; description?: string; image_url?: string; cover_image_url?: string; slug?: string }) => <Card key={item.id} className="p-0"><div className="aspect-[4/3] rounded-t-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${item.image_url ?? item.cover_image_url ?? "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80"})` }} /><div className="p-5"><h3 className="font-bold">{item.name ?? item.title}</h3><p className="mt-2 text-sm text-slate-500">{item.description}</p>{item.slug && <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary" to={`/${type}/${item.slug}`}>Details <ArrowRight className="h-4 w-4" /></Link>}</div></Card>) : <EmptyState title={`No ${type} records`} description="Publish records from the CRM to populate this page." />}</div>
    </Section>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const { data: projects = [] } = useTable("projects", { eq: { slug: slug ?? "" } });
  const project = projects[0] ?? demoProjects.find((item) => item.slug === slug);
  if (!project) return <Section title="Project not found"><EmptyState title="No project found" description="The requested project is not published or does not exist." /></Section>;
  return <><Seo title={`${project.name} | AMK Architects Mysuru Project`} description={`${project.name} by AMK Architects & Engineers in ${project.location}. View architecture project details, scope, and design approach.`} /><Section title={project.name}><Card><div className="aspect-video rounded-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${project.cover_image_url ?? ""})` }} /><p className="mt-6 leading-7 text-slate-600">{project.description}</p><p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" />{project.location}</p></Card></Section></>;
}

export function ContactPage({ compact = false }: { compact?: boolean }) {
  const { create } = useTableMutations("enquiries");
  const { branding } = useAppSettings();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", subject: "", message: "" });
  return (
    <>
      {!compact && <Seo title="Contact AMK Architects Mysuru | Architecture & Engineering Enquiry" description="Contact AMK Architects & Engineers in Mysuru, Karnataka for residential design, approval drawings, structural coordination, interiors, and project execution support." />}
      <Section title="Contact Us">
        <div className="grid gap-6 md:grid-cols-2">
          <Card><h3 className="mb-4 font-bold">Send an enquiry</h3><form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); await create.mutateAsync({ ...form, source: "website" }); setForm({ name: "", email: "", mobile: "", subject: "", message: "" }); }}><Input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /><Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /><Textarea required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><Button disabled={create.isPending}><Send className="h-4 w-4" /> Submit</Button></form></Card>
          <Card>
            <h3 className="mb-4 font-bold">Schedule a Consultation</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-brand-primary" />{branding.location}</p>
              <p>{branding.phone}</p>
              <p>{branding.email}</p>
              <p>www.amkarchitects.in</p>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">Tell us your ideas, goals, and project requirements. Together, we will create spaces that inspire, perform, and endure.</p>
          </Card>
        </div>
        {!compact && <div className="mt-8 grid gap-5 md:grid-cols-3">{["Dream residence", "Commercial development", "BIM, Parametric Design, or 3D Printing"].map((item) => <Card key={item}><h3 className="font-bold">{item}</h3><p className="mt-2 text-sm text-slate-500">Share your requirements and AMK will create a CRM lead for follow-up.</p></Card>)}</div>}
        {compact && <div className="mt-8 rounded-lg bg-gradient-to-r from-brand-primary to-brand-accent p-8 text-white"><h3 className="text-2xl font-bold">Let's build something extraordinary</h3><p className="mt-2">Whether you are planning a residence, commercial development, healthcare facility, layout project, interior transformation, or technology-led design solution, AMK is ready to turn your vision into reality.</p></div>}
      </Section>
    </>
  );
}

export function CustomerRegisterPage() {
  const { create } = useTableMutations("customers");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", mobile: "", address: "", notes: "" });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      name: form.name,
      company: form.company || null,
      email: form.email || null,
      mobile: form.mobile || null,
      address: form.address || null,
      notes: form.notes || "Registered from public website"
    });
    setSubmitted(true);
    setForm({ name: "", company: "", email: "", mobile: "", address: "", notes: "" });
  }
  return (
    <><Seo title="Customer Registration | AMK Architects & Engineers Mysuru" description="Register as an AMK Architects & Engineers customer to connect your project discussions, documents, approvals, quotations, invoices, and support history." /><Section title="Customer Registration">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-orange-100 text-brand-primary"><UserPlus className="h-6 w-6" /></div>
            <div>
              <h3 className="text-xl font-bold">Create your AMK customer profile</h3>
              <p className="text-sm text-slate-500">Your details are saved directly into the AMK CRM customer database.</p>
            </div>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            <label>
              <span className="mb-1 block text-sm font-medium">Full Name</span>
              <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Company</span>
              <Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Company or organization" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Email</span>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@example.com" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Mobile</span>
              <Input required value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} placeholder="+91 00000 00000" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Address</span>
              <Textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Project or billing address" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Project Notes</span>
              <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Tell us what you want to build or manage" />
            </label>
            <div className="md:col-span-2">
              <Button disabled={create.isPending}><UserPlus className="h-4 w-4" /> Register Customer</Button>
            </div>
          </form>
          {submitted && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Registration received. AMK will follow up using the details saved in CRM.</p>}
          {create.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{create.error.message}</p>}
        </Card>
        <Card className="bg-gradient-to-br from-slate-950 to-slate-800 text-white">
          <h3 className="text-2xl font-black">For clients planning a new project</h3>
          <p className="mt-4 text-sm leading-6 text-slate-300">Register once and AMK can track your communication, project history, approvals, drawings, invoices, support requests, and documents in one place.</p>
          <div className="mt-6 space-y-3 text-sm">
            {["Project communication history", "Approval and drawing records", "Invoice and payment tracking", "Support ticket continuity"].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-accent" />{item}</div>
            ))}
          </div>
        </Card>
      </div>
    </Section></>
  );
}
