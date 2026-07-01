import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Eye, Layers3, MapPin, Ruler, Send, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

function Section({ title, eyebrow = "AMK Studio", description, children }: { title: string; eyebrow?: string; description?: string; children: React.ReactNode }) {
  return (
    <motion.section
      className="mx-auto max-w-7xl px-4 py-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
        </div>
        {description && <p className="max-w-xl text-sm leading-7 text-slate-500">{description}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function InteractiveAccordion({ items }: { items: { title: string; text: string; meta?: string }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {items.map((item, index) => (
        <div key={item.title} className="border-b border-slate-200 last:border-b-0">
          <button
            type="button"
            onClick={() => setActive(active === index ? -1 : index)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-orange-50/60"
          >
            <span>
              <span className="text-xs font-black uppercase tracking-wide text-brand-primary">{item.meta ?? `Step ${index + 1}`}</span>
              <span className="mt-1 block font-bold text-slate-950">{item.title}</span>
            </span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${active === index ? "rotate-180 text-brand-primary" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {active === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{item.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function FlipInfoCard({ title, text, detail, icon: Icon }: { title: string; text: string; detail: string; icon: React.ElementType }) {
  return (
    <div className="flip-card h-72">
      <div className="flip-card-inner h-full">
        <div className="flip-card-face rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-orange-50 text-brand-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">Details <ArrowRight className="h-4 w-4" /></span>
        </div>
        <div className="flip-card-face flip-card-back rounded-lg bg-slate-950 p-6 text-white shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-brand-accent">Studio Method</div>
          <p className="mt-5 text-lg font-semibold leading-8">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function HoverRevealTile({ title, text, image, label }: { title: string; text: string; image: string; label?: string }) {
  return (
    <motion.div className="group relative min-h-80 overflow-hidden rounded-lg bg-slate-900 shadow-sm" whileHover={{ y: -5 }} transition={{ duration: 0.22 }}>
      <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${image})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent transition group-hover:from-slate-950 group-hover:via-slate-950/70" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        {label && <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-accent">{label}</div>}
        <h3 className="text-2xl font-black">{title}</h3>
        <p className="mt-3 max-h-0 overflow-hidden text-sm leading-7 text-slate-200 opacity-0 transition-all duration-300 group-hover:max-h-32 group-hover:opacity-100">{text}</p>
      </div>
    </motion.div>
  );
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
type PublicTestimonial = { id: string; name: string; company?: string | null; quote: string; rating?: number | null };

function openEnquiryModal() {
  window.dispatchEvent(new CustomEvent("open-enquiry-modal"));
}

const legacyEnquiryRoute = "/customer" + "-register";

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
  { id: "demo-testimonial-1", name: "Homeowner, Mysuru", company: "Residential Client", quote: "From the initial concept to the final design, the AMK team demonstrated exceptional creativity, professionalism, and technical expertise.", rating: 5 },
  { id: "demo-testimonial-2", name: "Commercial Property Owner", company: "Commercial Client", quote: "AMK Architects & Engineers delivered a well-planned commercial project that balanced design, efficiency, and investment value.", rating: 5 },
  { id: "demo-testimonial-3", name: "Real Estate Developer", company: "Development Client", quote: "Their expertise in planning, engineering coordination, and project execution gave us complete confidence throughout the project.", rating: 5 }
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
    cta_url: "#enquiry"
  }
];

const serviceDetails: Record<string, { intro: string; includes: string[]; signature: string }> = {
  "architecture-master-planning": {
    intro: "Creating functional, sustainable, and visually compelling environments that respond to both human needs and future possibilities.",
    includes: ["Luxury Residences & Villas", "Apartments & Group Housing", "Commercial & Office Buildings", "Mixed-Use Developments", "Educational & Institutional Buildings", "Healthcare Facilities & Hospitals", "Hospitality & Resort Projects", "Urban Design & Master Planning"],
    signature: "Every Great Building Begins with a Great Vision."
  },
  "architectural-design": {
    intro: "Creating functional, sustainable, and visually compelling environments that respond to both human needs and future possibilities.",
    includes: ["Luxury Residences & Villas", "Apartments & Group Housing", "Commercial & Office Buildings", "Mixed-Use Developments", "Educational & Institutional Buildings", "Healthcare Facilities & Hospitals", "Hospitality & Resort Projects", "Urban Design & Master Planning"],
    signature: "Every Great Building Begins with a Great Vision."
  },
  "interior-design-space-experience": {
    intro: "Designing interiors that elevate lifestyles, enhance productivity, and create memorable experiences.",
    includes: ["Residential Interiors", "Corporate Offices", "Retail & Commercial Interiors", "Hospitality Interiors", "Space Planning & Optimization", "Custom Furniture Design", "Material & Finish Selection"],
    signature: "Designing Spaces People Love to Live, Work, and Experience."
  },
  "bim-digital-engineering": {
    intro: "Leveraging Building Information Modelling (BIM) to improve coordination, reduce construction conflicts, and enhance project efficiency.",
    includes: ["BIM Modeling & Documentation", "Clash Detection & Coordination", "Construction Documentation", "Quantity Extraction", "Shop Drawings", "Digital Project Coordination"],
    signature: "Building Smarter Before Building Better."
  },
  "approval-drawings": {
    intro: "Leveraging Building Information Modelling (BIM) to improve coordination, reduce construction conflicts, and enhance project efficiency.",
    includes: ["BIM Modeling & Documentation", "Clash Detection & Coordination", "Construction Documentation", "Quantity Extraction", "Shop Drawings", "Digital Project Coordination"],
    signature: "Building Smarter Before Building Better."
  },
  "parametric-computational-design": {
    intro: "Harnessing advanced algorithms and digital workflows to create optimized, efficient, and innovative design solutions.",
    includes: ["Parametric Facade Design", "Complex Geometry Development", "Performance-Based Design", "Computational Design Solutions", "Digital Form Finding", "Generative Design Workflows"],
    signature: "From Algorithms to Architecture."
  },
  "engineering-solutions": {
    intro: "Integrated engineering systems that ensure performance, safety, and long-term reliability.",
    includes: ["Structural Coordination", "Electrical Design & Planning", "Plumbing Design", "Storm Water Management", "Infrastructure Planning", "Utility Coordination"],
    signature: "Engineering Precision into Every Project."
  },
  "structural-engineering": {
    intro: "Integrated engineering systems that ensure performance, safety, and long-term reliability.",
    includes: ["Structural Coordination", "Electrical Design & Planning", "Plumbing Design", "Storm Water Management", "Infrastructure Planning", "Utility Coordination"],
    signature: "Engineering Precision into Every Project."
  },
  "visualization-digital-experiences": {
    intro: "Helping clients visualize projects before construction begins through immersive digital experiences.",
    includes: ["Photorealistic Architectural Renderings", "Walkthrough Animations", "Virtual Reality Experiences", "Marketing & Presentation Visuals", "Drone Mapping & Site Analysis"],
    signature: "See It Before It's Built."
  },
  "3d-printing-digital-fabrication": {
    intro: "Exploring the future of construction through additive manufacturing and advanced fabrication technologies.",
    includes: ["3D Printed Buildings", "3D Printed Furniture", "Architectural Prototyping", "Design Mockups & Models", "Digital Fabrication Solutions"],
    signature: "Printing the Future of Architecture."
  },
  "project-management-execution-support": {
    intro: "Ensuring projects are delivered efficiently, on time, and to the highest quality standards.",
    includes: ["Site Supervision", "Contractor Coordination", "Quality Assurance", "Cost Monitoring", "Construction Management", "Technical Site Support"],
    signature: "From Concept to Completion."
  }
};

type ProcessStep = {
  title: string;
  text: string;
  note: string;
};

const designProcess: ProcessStep[] = [
  {
    title: "Discovery & Consultation",
    text: "Every successful project begins with understanding. We take the time to understand your vision, requirements, aspirations, site conditions, budget, and project goals to establish a strong foundation for design.",
    note: "Great Architecture Begins with Great Conversations."
  },
  {
    title: "Concept Design & Planning",
    text: "Our team transforms ideas into innovative design concepts through detailed site analysis, space planning, feasibility studies, and creative exploration. Multiple design options are evaluated to identify the most effective solution.",
    note: "Turning Ideas into Possibilities."
  },
  {
    title: "Design Development & BIM Integration",
    text: "The selected concept is refined through detailed plans, elevations, 3D models, material studies, BIM coordination, and technical design development. Every detail is carefully considered to ensure aesthetics, functionality, and constructability.",
    note: "Precision in Every Detail."
  },
  {
    title: "Construction Documentation & Approvals",
    text: "We prepare comprehensive construction drawings, technical specifications, BIM documentation, and approval submissions required for smooth project execution and regulatory compliance.",
    note: "Designed to Be Built."
  },
  {
    title: "Visualization & Project Coordination",
    text: "Through photorealistic renderings, walkthrough animations, BIM coordination, and digital reviews, clients gain a clear understanding of the project before construction begins.",
    note: "See It Before It's Built."
  },
  {
    title: "Execution Support & Quality Assurance",
    text: "Our involvement continues on site through regular inspections, contractor coordination, quality monitoring, and technical support to ensure the final outcome aligns with the original design vision.",
    note: "From Concept to Completion."
  },
  {
    title: "Project Handover",
    text: "The journey concludes with the successful delivery of a fully realized space that meets the highest standards of design, functionality, and craftsmanship.",
    note: "Delivering Spaces That Inspire."
  }
];

const performanceStats = [
  { value: "250+", label: "Projects Across South India", detail: "Residential, commercial, institutional, and large-scale developments handled through a structured studio process." },
  { value: "675,000+", label: "Square Feet of Thoughtfully Designed Spaces", detail: "Spaces planned with attention to function, engineering coordination, material comfort, and long-term use." },
  { value: "Multi-Sector", label: "Residential, Commercial, and Institutional Expertise", detail: "A portfolio spanning homes, workplaces, healthcare, hospitality, education, layouts, and adaptive reuse." },
  { value: "Complete Partner", label: "Architecture, Engineering, BIM, Visualization, and Execution", detail: "One integrated team connecting design strategy, technical documentation, digital workflows, and site delivery." }
];

const serviceAliases: Record<string, string> = {
  "architectural-design": "architecture-master-planning",
  "approval-drawings": "bim-digital-engineering",
  "structural-engineering": "engineering-solutions"
};

function serviceKey(service: { name?: string; slug?: string }) {
  const raw = service.slug ?? service.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ?? "";
  return serviceAliases[raw] ?? raw;
}

function mergeServiceRows<T extends { id: string; name?: string; slug?: string }>(rows: T[]) {
  const merged = new Map<string, T | typeof demoServices[number]>();
  demoServices.forEach((service) => merged.set(service.slug, service));
  rows.forEach((service) => {
    const key = serviceKey(service);
    const fallback = demoServices.find((item) => item.slug === key);
    merged.set(key, fallback ? { ...service, name: fallback.name, slug: fallback.slug, description: fallback.description, image_url: (service as { image_url?: string }).image_url || fallback.image_url } : service);
  });
  return Array.from(merged.values());
}

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

function DesignProcessSection({ title = "Our Design Process", subtitle = "From first conversation to handover." }: { title?: string; subtitle?: string }) {
  const [activeProcess, setActiveProcess] = useState(0);
  const reduceMotion = useReducedMotion();
  const activeStep = designProcess[activeProcess];
  const orbitPoints = designProcess.map((step, index) => {
    const angle = -90 + (360 / designProcess.length) * index;
    const radius = 43;
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { step, index, x, y };
  });
  const goToProcess = (index: number) => {
    setActiveProcess((index + designProcess.length) % designProcess.length);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white px-4 py-20 text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <div className="text-sm font-bold uppercase tracking-wide text-brand-primary">How We Work</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">A Clear Process From Vision to Handover</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">Our structured approach keeps every stage transparent, collaborative and aligned with your project goals.</p>
        </div>

        <div className="mx-auto hidden w-full max-w-6xl md:block">
          <div className="relative mx-auto aspect-square w-full max-w-[min(680px,calc(100vw-2rem))]">
            <div className="absolute inset-[15%] rounded-full border border-dashed border-orange-300/70" />
            <div className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle,rgba(248,106,13,0.13),rgba(255,255,255,0.74)_58%,rgba(255,255,255,0)_75%)]" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                  className="pointer-events-auto w-[clamp(280px,44vw,330px)] rounded-[24px] border border-orange-100 bg-white/95 p-5 text-center shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-md lg:p-7"
                >
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <span className="text-sm font-extrabold text-brand-primary">{String(activeProcess + 1).padStart(2, "0")}</span>
                    <span className="h-px w-8 bg-orange-300" />
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Active Stage</span>
                  </div>
                  <h3 className="text-lg font-black leading-tight text-slate-950 lg:text-xl">{activeStep.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{activeStep.text}</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-orange-100">
                    <motion.div className="h-full rounded-full bg-brand-primary" initial={false} animate={{ width: `${((activeProcess + 1) / designProcess.length) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.25 }} />
                  </div>
                  <div className="mt-5 flex justify-center gap-2">
                    <button type="button" onClick={() => goToProcess(activeProcess - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-primary hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-orange-200" aria-label="Previous process stage">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => goToProcess(activeProcess + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-primary hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-orange-200" aria-label="Next process stage">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {orbitPoints.map(({ step, index, x, y }) => {
              const isActive = index === activeProcess;
              return (
                <button
                  key={step.title}
                  type="button"
                  onMouseEnter={() => setActiveProcess(index)}
                  onFocus={() => setActiveProcess(index)}
                  onClick={() => setActiveProcess(index)}
                  aria-label={step.title}
                  className={`group absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-orange-200 md:h-12 md:w-12 lg:h-14 lg:w-14 ${isActive ? "z-40 scale-110 border-brand-primary bg-brand-primary text-white shadow-lg shadow-orange-200" : "z-20 border-orange-100 bg-white text-brand-primary hover:scale-105 hover:border-orange-200 hover:bg-orange-50"}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className={`relative z-10 transition ${isActive ? "text-base font-black text-white lg:text-lg" : "text-xs font-extrabold text-brand-primary group-hover:scale-110 group-hover:text-orange-600 md:text-sm"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-3 lg:grid-cols-7">
            {designProcess.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onMouseEnter={() => setActiveProcess(index)}
                onFocus={() => setActiveProcess(index)}
                onClick={() => setActiveProcess(index)}
                className={`min-h-20 rounded-xl border px-3 py-3 text-center text-xs font-bold leading-tight transition focus:outline-none focus:ring-2 focus:ring-orange-200 ${index === activeProcess ? "border-brand-primary bg-orange-50 text-brand-primary shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200"}`}
              >
                <span className="mb-1 block text-brand-primary">{String(index + 1).padStart(2, "0")}</span>
                {step.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:hidden">
          {designProcess.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setActiveProcess(index)}
              className={`rounded-lg border p-4 text-left transition ${index === activeProcess ? "border-brand-primary bg-white text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-sm font-black text-brand-primary">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-black">{step.title}</span>
              </div>
              {index === activeProcess && <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisionMissionToggle() {
  const [active, setActive] = useState<"vision" | "mission">("vision");
  const content = {
    vision: {
      eyebrow: "Our Vision",
      title: "Designing the Future of the Built Environment",
      text: "To become a leading technology-driven architecture and engineering practice that transforms ideas into intelligent, sustainable, and impactful spaces through innovation, creativity, and advanced design technologies.",
      points: ["Intelligent spaces", "Sustainable outcomes", "Advanced design technologies"]
    },
    mission: {
      eyebrow: "Our Mission",
      title: "Design excellence with advanced delivery",
      text: "To deliver exceptional architectural and engineering solutions by integrating design excellence, BIM, parametric design, emerging construction technologies, and collaborative thinking to create spaces that inspire people, enhance communities, and stand the test of time.",
      points: ["Design excellence", "BIM-enabled coordination", "Collaborative delivery"]
    }
  }[active];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="grid gap-8 rounded-xl bg-slate-950 p-6 text-white lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-brand-accent">Vision & Mission</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Switch between what guides us and how we deliver.</h2>
          <div className="mt-6 inline-grid rounded-full border border-white/10 bg-white/5 p-1 sm:grid-cols-2">
            {(["vision", "mission"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActive(item)}
                className={`relative rounded-full px-5 py-2 text-sm font-bold capitalize transition ${active === item ? "text-slate-950" : "text-slate-300 hover:text-white"}`}
              >
                {active === item && <motion.span layoutId="vision-mission-pill" className="absolute inset-0 rounded-full bg-brand-accent" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                <span className="relative">{item}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-80 rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-sm font-bold uppercase tracking-wide text-brand-accent">{content.eyebrow}</div>
              <h3 className="mt-3 text-3xl font-black leading-tight">{content.title}</h3>
              <p className="mt-5 text-sm leading-7 text-slate-300">{content.text}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {content.points.map((point) => (
                  <div key={point} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-200">{point}</div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function PerformanceSection() {
  const [active, setActive] = useState(0);
  const selected = performanceStats[active];
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Creating Spaces. Building Trust.</h2>
        <p className="max-w-xl text-sm leading-7 text-slate-500">Key measures from AMK's project portfolio and integrated studio delivery.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          key={selected.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-slate-950 p-7 text-white"
        >
          <div className="text-sm font-bold uppercase tracking-wide text-brand-accent">Selected Metric</div>
          <div className="mt-5 text-5xl font-black text-brand-accent md:text-6xl">{selected.value}</div>
          <h3 className="mt-4 text-2xl font-black">{selected.label}</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">{selected.detail}</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {performanceStats.map((stat, index) => (
            <motion.button
              key={stat.label}
              type="button"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              className={`rounded-lg border p-5 text-left shadow-sm transition ${active === index ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"}`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-3xl font-black text-brand-primary">{stat.value}</div>
              <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">{stat.label}</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div className="h-full rounded-full bg-brand-primary" animate={{ width: active === index ? "100%" : "35%" }} transition={{ duration: 0.25 }} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCarousel({ items }: { items: PublicTestimonial[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeItems = items.length ? items : demoTestimonials;
  const testimonial = safeItems[active % safeItems.length];
  const rating = Math.max(1, Math.min(5, testimonial.rating ?? 5));

  useEffect(() => {
    if (paused || safeItems.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % safeItems.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused, safeItems.length]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div
        className="grid gap-8 border-y border-slate-200 py-10 lg:grid-cols-[0.85fr_1.15fr]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex flex-col justify-center gap-5">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Client Testimonials</div>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">What clients say about working with AMK.</h2>
            <p className="mt-4 max-w-md text-sm font-normal leading-7 text-slate-500">Real feedback from residential, commercial, and development clients who trusted AMK for design, coordination, and project execution.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg text-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-80 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="flex gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`h-5 w-5 ${index < rating ? "fill-yellow-400" : "text-slate-200"}`} />
                ))}
              </div>
              <p className="mt-8 text-2xl font-normal leading-10 text-slate-600">"{testimonial.quote}"</p>
              <div className="mt-8 border-t border-slate-200 pt-5">
                <div className="text-xl font-semibold text-slate-950">{testimonial.name}</div>
                <div className="mt-1 text-sm font-normal text-slate-500">{testimonial.company}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { data: services = [] } = useTable("services", { limit: 6, orderBy: "created_at", eq: { status: "published" } });
  const { data: rawProjects = [] } = useTable("portfolio_projects", { limit: 6, orderBy: "display_order", eq: { status: "published" } });
  const projects: PublicProject[] = (rawProjects as Array<{ id: string; title: string; short_description?: string | null; category_id?: string | null; location?: string | null; cover_image_url?: string | null; slug: string }>).map((p) => ({ id: p.id, name: p.title, slug: p.slug, description: p.short_description, category: p.category_id ?? undefined, location: p.location, cover_image_url: p.cover_image_url }));
  const { data: testimonials = [] } = useTable("testimonials", { limit: 3, orderBy: "created_at", eq: { is_published: true } });
  const { data: banners = [] } = useTable("banners", { orderBy: "created_at", ascending: true, eq: { is_active: true } });
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const serviceRows = mergeServiceRows(services as typeof demoServices);
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
      <section className="relative min-h-[720px] overflow-hidden bg-slate-950 px-4 py-20 text-white">
        {bannerRows.map((item, index) => (
          <motion.div
            key={item.id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: index === activeSlide ? 1 : 0, scale: index === activeSlide ? 1 : 1.04 }}
            transition={{ duration: 0.9 }}
            style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,0.82), rgba(15,23,42,0.66)), linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.74)), url(${item.image_url ?? demoBanners[0].image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center justify-center">
          <div className="mx-auto max-w-5xl text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand-accent shadow-[0_0_20px_rgba(255,155,74,0.9)]" />
              Technology Driven Studio
            </motion.div>
            <motion.h1 key={slide.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-7 max-w-5xl text-5xl font-bold leading-tight tracking-normal md:text-6xl xl:text-7xl">{slide.title}</motion.h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">{slide.subtitle}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => (slide.cta_url === "#enquiry" || slide.cta_url === legacyEnquiryRoute || slide.cta_label?.toLowerCase() === "get started") ? openEnquiryModal() : location.href = slide.cta_url ?? "/contact"}
                className="group relative overflow-hidden rounded-full bg-white px-6 py-4 text-sm font-semibold text-slate-950 shadow-2xl shadow-orange-950/25 transition hover:-translate-y-1 hover:bg-brand-primary hover:text-white"
              >
                <span className="relative z-10 inline-flex items-center gap-2">{slide.cta_label ?? "Start a Project"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </button>
              <button
                type="button"
                onClick={() => location.href = "/projects"}
                className="group rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-1 hover:border-brand-accent hover:bg-white hover:text-slate-950"
              >
                <span className="inline-flex items-center gap-2">View Projects <Eye className="h-4 w-4" /></span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-slate-950/45 px-4 py-3 backdrop-blur">
          {bannerRows.map((item, index) => (
            <button key={item.id} aria-label={`Go to slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "w-12 bg-brand-primary" : "w-2.5 bg-white/45 hover:bg-white"}`} />
          ))}
        </div>
      </section>
      <DesignProcessSection />
      <Section title="End-to-End Design, Engineering & Construction Solutions" description="Architecture, engineering, BIM, visualization, and site support are planned as one connected studio service.">
        <div className="grid gap-5 md:grid-cols-3">
          {serviceRows.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
              whileHover={{ y: -4 }}
            >
              <FlipInfoCard
                title={service.name}
                text={service.description ?? "Complete design, documentation, coordination, and execution support for this service."}
                detail={(serviceDetails[serviceKey(service)]?.signature ?? "Concept, documentation, coordination, and site support stay connected from day one.")}
                icon={index % 3 === 0 ? Ruler : index % 3 === 1 ? Layers3 : ClipboardCheck}
              />
            </motion.div>
          ))}
        </div>
      </Section>
      <Section title="Integrated Capabilities" description="Each capability supports design clarity, technical coordination, and construction-ready documentation.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            [Ruler, "Architecture", "Functional, sustainable, and visually compelling environments for people and future possibilities."],
            [Layers3, "BIM Workflows", "Digital modelling and coordination that reduce conflicts and improve construction efficiency."],
            [ClipboardCheck, "Parametric Design", "Computational workflows for optimized facades, complex geometry, and performance-led forms."],
            [ShieldCheck, "Visualization", "Renderings, walkthroughs, VR, and digital reviews so clients can see it before it is built."]
          ].map(([Icon, title, text]) => (
            <motion.div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" whileHover={{ y: -5, borderColor: "rgba(248, 106, 13, 0.38)" }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-orange-100 text-brand-primary"><Icon className="h-6 w-6" /></div>
              <h3 className="font-bold">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{String(text)}</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div className="h-full rounded-full bg-brand-primary" initial={{ width: "24%" }} whileInView={{ width: "72%" }} whileHover={{ width: "100%" }} />
              </div>
            </motion.div>
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
      <Section title="Sectors We Serve" description="AMK works across residential, commercial, healthcare, hospitality, institutional, and layout development projects.">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Residential", "Luxury homes, villas, apartments, and gated communities designed around modern lifestyles.", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"],
            ["Commercial", "Workspaces, retail developments, mixed-use projects, and business environments that support growth.", "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"],
            ["Healthcare", "Hospitals, clinics, diagnostic centers, and wellness facilities planned around efficiency and patient care.", "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"],
            ["Hospitality", "Hotels, resorts, restaurants, and experiential destinations designed to leave lasting impressions.", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"],
            ["Institutional", "Educational campuses, public buildings, and community-focused developments.", "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"],
            ["Layout Development", "Master planning, land development, infrastructure design, and township planning solutions.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"]
          ].map(([title, text, image]) => (
            <HoverRevealTile key={title} title={title} text={text} image={image} label="Sector" />
          ))}
        </div>
      </Section>
      <PerformanceSection />
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
      <TestimonialCarousel items={testimonialRows as PublicTestimonial[]} />
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  );
}

export function ListingPage({ type }: { type: "projects" | "services" | "gallery" | "about" }) {
  const table = type === "services" ? "services" : type === "gallery" ? "gallery" : "portfolio_projects";
  const { data = [] } = useTable(table as never, { orderBy: "created_at" });
  const [filter, setFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [preview, setPreview] = useState<PublicGallery | null>(null);
  const fallbackRows = type === "services" ? demoServices : type === "gallery" ? demoGallery : demoProjects;
  const sourceRows = type === "services" ? mergeServiceRows(data as typeof demoServices) : data.length ? data : fallbackRows;
  const rows = useMemo(() => sourceRows.filter((item: { name?: string; title?: string; category?: string }) => `${item.name ?? item.title ?? ""} ${item.category ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [sourceRows, filter]);
  if (type === "about") return (
    <>
      <Seo title="About AMK Architects & Engineers Mysuru | Technology-Driven Architecture Studio" description="AMK Architects & Engineers is a Mysuru-based technology-driven architecture and engineering studio integrating BIM, parametric design, visualization, digital fabrication, and project delivery." />
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl text-sm font-bold uppercase tracking-wide text-brand-accent">About AMK</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">We do not just design buildings. We shape the future.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">At AMK Architects & Engineers, architecture is where creativity, technology, and human experience come together. Every space we design is driven by purpose, engineered with precision, and crafted to create lasting value.</p>
        </div>
      </section>
      <Section title="About Us" description="A technology-led studio model where design intent, engineering coordination, visualization, and site delivery move together.">
        <div className="grid gap-8 rounded-xl bg-slate-50 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="space-y-5 text-sm leading-7 text-slate-600">
            <p>Founded by Ar. Andra Manoj Kumar, AMK is a technology-driven architecture and engineering studio based in Mysuru. Our expertise extends beyond conventional architectural practice into Building Information Modelling (BIM), parametric design, computational workflows, 3D visualization, 3D printed buildings, and digital fabrication technologies.</p>
            <p>We work across residential, commercial, institutional, healthcare, hospitality, and large-scale development projects, delivering innovative solutions that balance design excellence, technical performance, sustainability, and construction efficiency.</p>
            <p>By combining architectural creativity with advanced engineering and emerging technologies, we help clients transform ambitious ideas into built realities.</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-wide text-brand-primary">Technology-Led Practice</div>
            <h3 className="mt-3 text-3xl font-black leading-tight">Building tomorrow through design intelligence.</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["BIM Workflows", "Parametric Design", "3D Visualization", "Digital Fabrication"].map((item) => (
                <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">The studio combines architectural creativity with engineering precision and emerging construction technologies.</p>
          </div>
        </div>
      </Section>
      <Section title="Meet the Founder" description="AMK is led with a focus on architecture, computation, BIM, visualization, and delivery discipline.">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <FlipInfoCard
            title="Ar. Andra Manoj Kumar"
            text="Architect | Computational Designer | BIM Specialist | Architectural Visualizer"
            detail="The studio is shaped around design clarity, BIM coordination, realistic visualization, and construction-ready decision making."
            icon={Sparkles}
          />
          <Card>
            <p className="text-lg leading-8 text-slate-600">Architecture today demands more than drawings. It requires technology, data, visualization, and execution expertise working together. AMK creates spaces that are intelligent, efficient, sustainable, and timeless.</p>
          </Card>
        </div>
      </Section>
      <Section title="Our Philosophy" description="Open each idea to see how it affects project decisions, documentation, and site execution.">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <h3 className="text-2xl font-black">Design should not only look exceptional; it should perform exceptionally.</h3>
          </Card>
          <InteractiveAccordion items={[
            { title: "Collaborative discovery", text: "Every project begins with a deep understanding of the client's vision and evolves through a collaborative process that integrates design thinking, data-driven decisions, and technical expertise.", meta: "Idea 01" },
            { title: "Performance-led design", text: "Plans, materials, services, structure, and approval constraints are tested against real project outcomes so the design works beyond presentation visuals.", meta: "Idea 02" },
            { title: "Execution continuity", text: "From concept development and approvals to execution and delivery, AMK remains committed to creating spaces that inspire, function, and endure.", meta: "Idea 03" }
          ]} />
        </div>
      </Section>
      <VisionMissionToggle />
      <DesignProcessSection subtitle="A complete path from discovery to handover." />
      <Section title="What We Stand For" description="Flip each principle to reveal how it shows up in the studio's daily work.">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Creativity", "Every project begins with purpose-led design thinking and a clear understanding of the client's vision."],
            ["Technology", "BIM, parametric design, digital fabrication, and visualization are integrated into the design process."],
            ["Performance", "Spaces are planned to inspire, function, endure, and deliver long-term value."]
          ].map(([title, text], index) => <FlipInfoCard key={title} title={title} text={text} detail="This principle is checked through concept reviews, technical coordination, client decisions, and site follow-through." icon={index === 0 ? Sparkles : index === 1 ? Layers3 : BarChart3} />)}
        </div>
      </Section>
      <Section title="Our Mysuru Design Approach" description="The studio balances local context, approvals, client lifestyles, and modern performance.">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <HoverRevealTile title="Mysuru context, modern performance" text="AMK balances local climate, client lifestyles, approvals, construction realities, and contemporary design ambition." image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80" label="Approach" />
          <InteractiveAccordion items={["Design should not only look exceptional; it should perform exceptionally.", "Every project evolves through collaboration, data-driven decision making, and technical expertise.", "From concept development and approvals to execution and delivery, AMK creates spaces that inspire, function, and endure."].map((item, index) => ({ title: item, text: "This checkpoint keeps aesthetics, usability, engineering, approvals, and delivery aligned through the project lifecycle.", meta: `Focus 0${index + 1}` }))} />
        </div>
      </Section>
    </>
  );
  if (type === "projects") return (
    <>
      <Seo title="Architecture Projects in Mysuru | AMK Architects & Engineers Portfolio" description="View AMK Architects & Engineers project portfolio including Mysuru residences, commercial studios, interiors, approvals, and architecture project management." />
      <Section title="Projects in Mysuru" description="Selected architecture and engineering projects across Mysuru and surrounding regions.">
        <Input className="mb-6 max-w-md" aria-label="Project filter" value={filter} onChange={(event) => setFilter(event.target.value)} />
        <div className="grid gap-5 md:grid-cols-3">{rows.map((item) => {
          const project = item as PublicProject;
          return <button key={project.id} className="text-left" onClick={() => setSelectedProject(project)}><HoverRevealTile title={project.name} text={project.location ?? project.description ?? "Open this project to review the location, project stage, scope, and AMK delivery details."} image={project.cover_image_url ?? "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"} label={project.category ?? "Project"} /></button>;
        })}</div>
      </Section>
      <Section title="Project Delivery Includes" description="Open each delivery area to see what is documented and coordinated during the project.">
        <InteractiveAccordion items={["Concept design", "Approval drawings", "Structural coordination", "Site execution support"].map((item, index) => ({ title: item, text: "Documented and tracked through AMK project operations so design intent, approvals, engineering inputs, and site decisions remain connected.", meta: `Delivery 0${index + 1}` }))} />
      </Section>
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  );
  if (type === "services") return (
    <>
      <Seo title="Architecture Services Mysuru | BIM, Parametric Design & Engineering" description="AMK Architects & Engineers offers architecture, master planning, interiors, BIM, parametric design, engineering, visualization, 3D printing, digital fabrication, and execution support in Mysuru." />
      <Section title="Architecture & Engineering Services" description="Comprehensive design, engineering, BIM, visualization, and project delivery support.">
        <div className="grid gap-6">
          {rows.map((item) => {
            const service = item as { id: string; name?: string; slug?: string; description?: string; image_url?: string };
            const detail = serviceDetails[service.slug ?? ""] ?? {
              intro: service.description ?? "",
              includes: [],
              signature: "From Concept to Completion."
            };
            return (
              <motion.div key={service.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} whileHover={{ y: -4 }}>
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="group relative min-h-72 overflow-hidden bg-slate-200">
                    <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${service.image_url ?? "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent opacity-70" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <div className="text-xs font-bold uppercase tracking-wide text-brand-accent">Service</div>
                      <div className="mt-2 text-2xl font-black">{service.name}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-black">{service.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{detail.intro || service.description}</p>
                    {detail.includes.length > 0 && (
                      <>
                        <h4 className="mt-5 text-sm font-bold uppercase tracking-wide text-brand-primary">Services Include</h4>
                        <div className="mt-3"><InteractiveAccordion items={detail.includes.slice(0, 6).map((entry, index) => ({ title: entry, text: "This scope can be combined with concept design, documentation, BIM coordination, visualization, approvals, and execution support as required.", meta: `Scope 0${index + 1}` }))} /></div>
                      </>
                    )}
                    <div className="mt-6 rounded-md bg-orange-50 p-4 text-sm font-semibold text-slate-700">"{detail.signature}"</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>
      <Section title="How We Work" description="An interactive process accordion keeps the workflow scannable without hiding the critical steps.">
        <InteractiveAccordion items={["Discovery & Consultation", "Concept Design & Planning", "Design Development & BIM", "Execution Support & Handover"].map((item, index) => ({ title: item, text: "AMK uses this stage to align client decisions, drawings, digital models, consultant inputs, approvals, and site-ready documentation.", meta: `0${index + 1}` }))} />
      </Section>
    </>
  );
  if (type === "gallery") return (
    <>
      <Seo title="Architecture Gallery Mysuru | AMK Architects Project Albums" description="Explore AMK Architects & Engineers gallery albums featuring residential elevations, interiors, workspaces, material palettes, and approval drawing documentation from Mysuru projects." />
      <Section title="Project Gallery Albums" description="Residential, commercial, interior, material, and documentation visuals from AMK projects.">
        <Input className="mb-6 max-w-md" aria-label="Gallery filter" value={filter} onChange={(event) => setFilter(event.target.value)} />
        <div className="grid gap-5 md:grid-cols-3">{rows.map((item) => {
          const gallery = item as PublicGallery;
          return <button key={gallery.id} className="text-left" onClick={() => setPreview(gallery)}><HoverRevealTile title={gallery.title} text={gallery.description ?? "Open this album for a focused project image preview."} image={gallery.image_url} label={gallery.category ?? "Gallery"} /></button>;
        })}</div>
      </Section>
      <Section title="Gallery Categories" description="Flip each category to see what kind of work it usually contains.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{["Residential", "Commercial", "Interior", "Documentation"].map((item, index) => <FlipInfoCard key={item} title={item} text="Curated project visuals and design documentation from AMK work." detail="Albums help clients compare material mood, spatial character, execution quality, and technical presentation across project types." icon={index % 2 === 0 ? Eye : ClipboardCheck} />)}</div>
      </Section>
      {preview && <GalleryPreview item={preview} onClose={() => setPreview(null)} />}
    </>
  );
  return (
    <Section title={type}>
      <Input className="mb-6 max-w-md" aria-label={`${type} filter`} value={filter} onChange={(event) => setFilter(event.target.value)} />
      <div className="grid gap-5 md:grid-cols-3">{rows.length ? rows.map((item: { id: string; name?: string; title?: string; description?: string; image_url?: string; cover_image_url?: string; slug?: string }) => <Card key={item.id} className="p-0"><div className="aspect-[4/3] rounded-t-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${item.image_url ?? item.cover_image_url ?? "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80"})` }} /><div className="p-5"><h3 className="font-bold">{item.name ?? item.title}</h3><p className="mt-2 text-sm text-slate-500">{item.description}</p>{item.slug && <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary" to={`/${type}/${item.slug}`}>Details <ArrowRight className="h-4 w-4" /></Link>}</div></Card>) : <EmptyState title={`No ${type} records`} description="Publish records from the CRM to populate this page." />}</div>
    </Section>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const { data: projects = [] } = useTable("portfolio_projects", { eq: { slug: slug ?? "", status: "published" } });
  const rawProject = projects[0] as { id: string; title?: string; name?: string; short_description?: string | null; description?: string | null; location?: string | null; cover_image_url?: string | null } | undefined;
  const project: PublicProject | undefined = rawProject ? { id: rawProject.id, name: rawProject.title ?? rawProject.name ?? "", description: rawProject.short_description ?? rawProject.description, location: rawProject.location, cover_image_url: rawProject.cover_image_url } : demoProjects.find((item) => item.slug === slug);
  if (!project) return <Section title="Project not found"><EmptyState title="No project found" description="The requested project is not published or does not exist." /></Section>;
  return <><Seo title={`${project.name} | AMK Architects Mysuru Project`} description={`${project.name} by AMK Architects & Engineers in ${project.location}. View architecture project details, scope, and design approach.`} /><Section title={project.name}><Card><div className="aspect-video rounded-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${project.cover_image_url ?? ""})` }} /><p className="mt-6 leading-7 text-slate-600">{project.description}</p><p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" />{project.location}</p></Card></Section></>;
}

export function ContactPage({ compact = false }: { compact?: boolean }) {
  const { create } = useTableMutations("enquiries");
  const { branding } = useAppSettings();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", subject: "", message: "" });
  const enquiryTypes = ["Architecture Consultation", "Commercial Development", "BIM / Parametric Design", "Interior Transformation", "3D Printing & Fabrication"];
  const responseSteps = [
    ["01", "Share requirements", "Tell us the project type, location, goals, and current stage."],
    ["02", "Studio review", "AMK reviews the scope and identifies the right design and engineering route."],
    ["03", "Consultation", "The team follows up with next steps, documentation needs, and a project direction."]
  ];
  if (compact) return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="grid gap-5 rounded-lg bg-slate-950 p-6 text-white lg:grid-cols-[1fr_1fr]">
        <div className="rounded-md bg-gradient-to-r from-brand-primary to-brand-accent p-6">
          <h3 className="text-2xl font-bold">Let's build something extraordinary</h3>
          <p className="mt-2 text-sm leading-7">Whether you are planning a residence, commercial development, healthcare facility, layout project, interior transformation, or technology-led design solution, AMK is ready to turn your vision into reality.</p>
        </div>
        <InteractiveAccordion items={enquiryTypes.slice(0, 4).map((item, index) => ({ title: item, text: "Start with a short project note and AMK will route the conversation to the relevant design, engineering, BIM, visualization, or execution workflow.", meta: `Enquiry 0${index + 1}` }))} />
      </div>
    </section>
  );
  return (
    <>
      <Seo title="Contact AMK Architects Mysuru | Architecture & Engineering Enquiry" description="Contact AMK Architects & Engineers in Mysuru, Karnataka for residential design, approval drawings, structural coordination, interiors, and project execution support." />
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Contact AMK</div>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Start a focused conversation about your next space.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">Share your site, project goals, design expectations, or technology-led requirements. AMK will route the enquiry into the right architecture, engineering, BIM, visualization, or execution workflow.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="grid gap-3 sm:grid-cols-2">
            {[
              ["Location", branding.location],
              ["Phone", branding.phone],
              ["Email", branding.email],
              ["Website", "www.amkarchitects.in"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-brand-accent">{label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-200">{value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.35 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Project Enquiry</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Tell us what you want to build.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">Choose a project type or write your own subject. The enquiry is saved directly into AMK's CRM for follow-up.</p>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {enquiryTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setForm({ ...form, subject: item })}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${form.subject === item ? "border-brand-primary bg-orange-50 text-brand-primary" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); await create.mutateAsync({ ...form, source: "website" }); setForm({ name: "", email: "", mobile: "", subject: "", message: "" }); }}>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Mobile</span>
                <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Subject</span>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Project Brief</span>
                <Textarea className="min-h-40" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
              <div className="md:col-span-2">
                <Button disabled={create.isPending}><Send className="h-4 w-4" /> Submit Enquiry</Button>
              </div>
            </form>
            {create.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{create.error.message}</p>}
          </motion.div>
          <div className="grid gap-5">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.35, delay: 0.08 }} className="rounded-xl bg-slate-50 p-6">
              <h2 className="text-2xl font-semibold tracking-tight">How the consultation moves forward</h2>
              <div className="mt-6"><InteractiveAccordion items={responseSteps.map(([number, title, text]) => ({ title, text, meta: number }))} /></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.35, delay: 0.14 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">Useful details to include</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Project type and site location", "Approximate area or scale", "Current stage and timeline", "Design, BIM, approval, or execution needs"].map((item, index) => (
                  <motion.div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700" whileHover={{ y: -3, borderColor: "rgba(248, 106, 13, 0.35)" }}>
                    <div className="text-2xl font-black text-brand-primary">0{index + 1}</div>
                    <div className="mt-2">{item}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
