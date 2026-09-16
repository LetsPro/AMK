import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Eye, Layers3, LogIn, MapPin, Play, Ruler, Send, Sparkles, Star, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";
import { Seo } from "@/components/seo/Seo";

function Section({ id, title, eyebrow = "AMK Studio", description, children }: { id?: string; title: string; eyebrow?: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="architectural-section mx-auto max-w-7xl scroll-mt-24 px-4 py-14 md:py-28">
      <div className="mb-10 flex flex-col gap-5 border-l border-brand-primary/40 pl-5 md:flex-row md:items-end md:justify-between md:pl-8">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">
            <span className="h-px w-8 bg-brand-primary" />
            {eyebrow}
          </div>
          <h2 className="mt-4 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.025em] text-slate-950 md:text-6xl">{title}</h2>
        </div>
        {description && <p className="max-w-xl text-sm leading-7 text-slate-500 md:text-base">{description}</p>}
      </div>
      {children}
    </section>
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
        <div className="flip-card-face flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-orange-50 text-brand-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="mt-auto">
            <h3 className="text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p>
          </div>
        </div>
        <div className="flip-card-face flip-card-back flex flex-col justify-between rounded-lg bg-slate-950 p-6 text-white shadow-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-brand-accent">Studio Method</div>
            <h3 className="mt-4 text-xl font-black">{title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-200">{text}</p>
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold leading-6 text-brand-accent">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ServiceExplorer({ items }: { items: Array<{ id: string; name?: string; slug?: string; description?: string | null; image_url?: string | null }> }) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  if (!items.length) return null;

  const activeIndex = active % items.length;
  const service = items[activeIndex];
  const detail = serviceDetails[serviceKey(service)] ?? {
    intro: service.description ?? "Design, documentation, coordination, and delivery support developed as one connected service.",
    includes: [],
    signature: "From concept to completion."
  };
  const image = service.image_url ?? "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80";

  return (
    <div className="grid overflow-hidden border-y border-slate-200 bg-white lg:grid-cols-[0.78fr_1.22fr]">
      <div className="relative z-10 bg-white lg:border-r lg:border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-7">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Service index</span>
          <span className="text-xs font-semibold tabular-nums text-slate-400">{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-1">
          {items.map((item, index) => {
            const Icon = index % 3 === 0 ? Ruler : index % 3 === 1 ? Layers3 : ClipboardCheck;
            const isActive = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-pressed={isActive}
                className={`group relative flex min-h-16 items-center gap-4 border-b border-slate-200 px-5 py-4 text-left outline-none transition-colors md:px-7 ${isActive ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50"}`}
              >
                {isActive && <motion.span layoutId="active-service-rule" className="absolute inset-y-0 left-0 w-1 bg-brand-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className={`text-xs font-semibold tabular-nums ${isActive ? "text-brand-accent" : "text-slate-400"}`}>{String(index + 1).padStart(2, "0")}</span>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-brand-primary"}`} />
                <span className="text-sm font-semibold leading-5 md:text-base">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-[34rem] overflow-hidden bg-slate-950 text-white lg:min-h-[39rem]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${service.id}-image`}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.045 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.12),rgba(2,6,23,.94))]" />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="relative z-10 flex min-h-[34rem] flex-col justify-end p-6 md:p-10 lg:min-h-[39rem] lg:p-12">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={service.id}
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent"><span className="h-px w-10 bg-brand-accent" />AMK discipline</div>
              <h3 className="max-w-xl text-3xl font-medium leading-[1.04] tracking-[-0.025em] md:text-5xl">{service.name}</h3>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">{detail.intro || service.description}</p>
              {detail.includes.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                  {detail.includes.slice(0, 3).map((item) => <span key={item} className="border-l border-brand-primary pl-3">{item}</span>)}
                </div>
              )}
              <p className="mt-8 border-t border-white/20 pt-5 text-sm font-semibold text-white">{detail.signature}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function HoverRevealTile({ title, text, image, label }: { title: string; text: string; image: string; label?: string }) {
  return (
    <motion.div className="group relative min-h-80 overflow-hidden rounded-lg bg-slate-900 shadow-sm" whileHover={{ y: -5 }} transition={{ duration: 0.22 }}>
      <img src={image} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl" />
      <img src={image} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain transition duration-700 group-hover:scale-[1.03]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent transition group-hover:from-slate-950 group-hover:via-slate-950/70" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        {label && <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-accent">{label}</div>}
        <h3 className="text-2xl font-black">{title}</h3>
        <p className="mt-3 max-h-0 overflow-hidden text-sm leading-7 text-slate-200 opacity-0 transition-all duration-300 group-hover:max-h-32 group-hover:opacity-100">{text}</p>
      </div>
    </motion.div>
  );
}

type PublicProjectGalleryImage = { id: string; image_url: string; media_type?: "image" | "video"; caption?: string | null; display_order?: number | null };
type PublicProject = { id: string; name: string; slug?: string; description?: string | null; category?: string | null; location?: string | null; cover_image_url?: string | null; progress?: number | null; status?: string | null; budget?: number | null; portfolio_gallery?: PublicProjectGalleryImage[] };
type PublicGallery = { id: string; title: string; category?: string | null; image_url: string; description?: string | null };
type PublicTestimonial = { id: string; name: string; company?: string | null; quote: string; rating?: number | null; avatar_url?: string | null; video_url?: string | null };

function testimonialAutoplaySeconds(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 3;
  const seconds = Number((value as Record<string, unknown>).seconds);
  return Number.isFinite(seconds) ? Math.min(30, Math.max(2, Math.round(seconds))) : 3;
}

function openEnquiryModal() {
  window.dispatchEvent(new CustomEvent("open-enquiry-modal"));
}

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
  { id: "demo-project-1", name: "Chamundi Hill Residence", slug: "chamundi-hill-residence", description: "A contemporary family residence planned for natural ventilation, framed views, and warm material finishes.", category: "Residential", location: "Chamundi Hill Road, Mysuru, Karnataka, India", cover_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80", portfolio_gallery: [
    { id: "demo-project-1-gallery-1", image_url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80", display_order: 1 },
    { id: "demo-project-1-gallery-2", image_url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80", display_order: 2 },
  ] },
  { id: "demo-project-2", name: "Vijayanagar Courtyard Home", slug: "vijayanagar-courtyard-home", description: "A courtyard-led home with shaded transitions, efficient planning, and indoor-outdoor living.", category: "Residential", location: "Vijayanagar, Mysuru, Karnataka, India", cover_image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80", portfolio_gallery: [
    { id: "demo-project-2-gallery-1", image_url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80", display_order: 1 },
    { id: "demo-project-2-gallery-2", image_url: "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1400&q=80", display_order: 2 },
  ] },
  { id: "demo-project-3", name: "Hebbal Workspace Studio", slug: "hebbal-workspace-studio", description: "A compact commercial studio designed for flexible workstations, client meetings, and daylight.", category: "Commercial", location: "Hebbal Industrial Area, Mysuru, Karnataka, India", cover_image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80", portfolio_gallery: [
    { id: "demo-project-3-gallery-1", image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80", display_order: 1 },
    { id: "demo-project-3-gallery-2", image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80", display_order: 2 },
  ] }
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
  { id: "demo-testimonial-1", name: "Homeowner, Mysuru", company: "Residential Client", quote: "From the initial concept to the final design, the AMK team demonstrated exceptional creativity, professionalism, and technical expertise.", rating: 5, avatar_url: null, video_url: null },
  { id: "demo-testimonial-2", name: "Commercial Property Owner", company: "Commercial Client", quote: "AMK Architects & Engineers delivered a well-planned commercial project that balanced design, efficiency, and investment value.", rating: 5, avatar_url: null, video_url: null },
  { id: "demo-testimonial-3", name: "Real Estate Developer", company: "Development Client", quote: "Their expertise in planning, engineering coordination, and project execution gave us complete confidence throughout the project.", rating: 5, avatar_url: null, video_url: null }
];

const demoBanners = [
  {
    id: "demo-banner-1",
    title: "Beyond Buildings. We Design Experiences.",
    subtitle: "Technology-driven architecture and engineering studio in Mysuru creating intelligent, sustainable, and future-ready spaces.",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80"
  },
  {
    id: "demo-banner-2",
    title: "Where Architecture Meets Innovation",
    subtitle: "Architecture, engineering, BIM workflows, parametric design, visualization, and execution support from concept to completion.",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80"
  },
  {
    id: "demo-banner-3",
    title: "Designing Tomorrow. Building Beyond.",
    subtitle: "From luxury residences and commercial spaces to healthcare, hospitality, institutional, and large-scale development projects.",
    image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
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
  { value: 250, suffix: "+", label: "Projects delivered", detail: "Across residential, commercial, and institutional work." },
  { value: 675000, suffix: "+", label: "Square feet designed", detail: "Planned for performance, comfort, and long-term value." },
  { value: 8, suffix: "+", label: "Studio disciplines", detail: "From architecture and BIM to visualization and execution." },
  { value: 6, suffix: "+", label: "Sectors served", detail: "Homes, workplaces, healthcare, hospitality, education, and layouts." }
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
  const reduceMotion = useReducedMotion();
  const [imageIndex, setImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState(1);
  const images = useMemo(() => {
    const gallery = [...(project.portfolio_gallery ?? [])]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((image) => ({ url: image.image_url, mediaType: image.media_type ?? "image" as const, caption: image.caption }));
    const allImages = project.cover_image_url
      ? [{ url: project.cover_image_url, mediaType: "image" as const, caption: project.name }, ...gallery]
      : gallery;
    const uniqueImages = new Map<string, { url: string; mediaType: "image" | "video"; caption?: string | null }>();
    allImages.forEach((image) => image.url && !uniqueImages.has(image.url) && uniqueImages.set(image.url, image));
    return [...uniqueImages.values()];
  }, [project]);
  const fallbackImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80";
  const visibleImages = images.length ? images : [{ url: fallbackImage, mediaType: "image" as const, caption: project.name }];
  const activeImage = visibleImages[imageIndex % visibleImages.length];
  const goToImage = (nextIndex: number) => {
    setImageDirection(nextIndex > imageIndex ? 1 : -1);
    setImageIndex((nextIndex + visibleImages.length) % visibleImages.length);
  };

  useEffect(() => {
    setImageIndex(0);
    setImageDirection(1);
  }, [project.id]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1001] grid place-items-center bg-slate-950/75 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="relative flex min-h-72 max-h-[68vh] items-center justify-center overflow-hidden bg-slate-900 sm:min-h-[440px]">
          <AnimatePresence initial={false} custom={imageDirection} mode="popLayout">
            {activeImage.mediaType === "video"
              ? <motion.video key={activeImage.url} src={activeImage.url} controls playsInline preload="metadata" initial={reduceMotion ? false : { opacity: 0.65, x: imageDirection * 110 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0.4, x: imageDirection * -110 }} transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }} className="max-h-[68vh] w-full object-contain" />
              : <motion.img
                  key={activeImage.url}
                  src={activeImage.url}
                  alt={activeImage.caption || `${project.name} gallery image ${imageIndex + 1}`}
                  loading="eager"
                  decoding="async"
                  initial={reduceMotion ? false : { opacity: 0.65, x: imageDirection * 110 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0.4, x: imageDirection * -110 }}
                  transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className="max-h-[68vh] w-full object-contain"
                />}
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />
          <button className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow transition hover:bg-white" onClick={onClose} aria-label="Close project"><X className="h-5 w-5" /></button>
          {visibleImages.length > 1 && (
            <>
              <button type="button" onClick={() => goToImage(imageIndex - 1)} className="absolute left-4 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-slate-950/45 text-white backdrop-blur transition hover:bg-white hover:text-slate-950" aria-label="Previous gallery image"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={() => goToImage(imageIndex + 1)} className="absolute right-4 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-slate-950/45 text-white backdrop-blur transition hover:bg-white hover:text-slate-950" aria-label="Next gallery image"><ChevronRight className="h-5 w-5" /></button>
              <div className="absolute bottom-4 right-4 z-20 rounded-full border border-white/25 bg-slate-950/55 px-3 py-1.5 text-[10px] font-semibold tabular-nums tracking-[0.16em] text-white backdrop-blur">{String(imageIndex + 1).padStart(2, "0")} / {String(visibleImages.length).padStart(2, "0")}</div>
            </>
          )}
        </div>
        {visibleImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-6 py-4" aria-label={`Gallery image ${imageIndex + 1} of ${visibleImages.length}`}>
            {visibleImages.map((image, index) => (
              <button key={image.url} type="button" onClick={() => goToImage(index)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${index === imageIndex ? "border-brand-primary opacity-100 shadow-sm" : "border-transparent opacity-55 hover:opacity-100"}`} aria-label={`Show gallery image ${index + 1}`}>
                {image.mediaType === "video" ? <video src={image.url} muted preload="metadata" className="h-full w-full bg-black object-contain" /> : <img src={image.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />}
              </button>
            ))}
          </div>
        )}
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
    <div className="fixed inset-0 z-[1001] grid place-items-center bg-slate-950/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div><h2 className="text-xl font-black">{item.title}</h2><p className="text-sm text-slate-500">{item.category}</p></div>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" onClick={onClose} aria-label="Close preview"><X className="h-5 w-5" /></button>
        </div>
        <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" className="max-h-[72vh] w-full object-contain bg-slate-950" />
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
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white px-4 py-20 text-slate-950">
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

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.7 });
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 1500;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, value]);

  return <span ref={ref}>{displayValue.toLocaleString("en-IN")}{suffix}</span>;
}

function PerformanceSection() {
  return (
    <motion.section
      className="relative overflow-hidden border-y border-slate-200 bg-[#f3efe7] px-4 py-20 md:py-28"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.08)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="relative mx-auto max-w-7xl">
      <div className="mb-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-primary">Studio in numbers</div>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-none tracking-[-0.03em] text-slate-950 md:text-6xl">Measured experience.<br />Thoughtful outcomes.</h2>
        </div>
        <p className="max-w-xl border-l border-slate-300 pl-5 text-sm leading-7 text-slate-600 md:text-base">A concise view of the scale, range, and connected expertise behind AMK's architecture and engineering work.</p>
      </div>
      <div className="grid border-l border-t border-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          {performanceStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group relative min-h-64 border-b border-r border-slate-300 bg-white/55 p-6 backdrop-blur-sm md:p-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.9)" }}
            >
              <div className="text-xs tabular-nums text-slate-400">0{index + 1}</div>
              <div className="mt-10 text-4xl font-medium tracking-[-0.04em] text-slate-950 md:text-5xl"><AnimatedCounter value={stat.value} suffix={stat.suffix} /></div>
              <h3 className="mt-5 text-base font-semibold text-slate-800">{stat.label}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{stat.detail}</p>
              <motion.span className="absolute bottom-0 left-0 h-1 bg-brand-primary" initial={{ width: 0 }} whileInView={{ width: "38%" }} whileHover={{ width: "100%" }} transition={{ duration: 0.55 }} />
            </motion.div>
          ))}
      </div>
      </div>
    </motion.section>
  );
}

function ProjectCarousel3D({ items, active, onChange, onOpen }: { items: PublicProject[]; active: number; onChange: (index: number) => void; onOpen: (project: PublicProject) => void }) {
  const reduceMotion = useReducedMotion();
  const [imageIndex, setImageIndex] = useState(0);
  const activeProjectRef = useRef(active);
  const currentProject = items[active % items.length];
  const currentMedia = useMemo(() => {
    if (!currentProject) return [];
    const media = [
      ...(currentProject.cover_image_url ? [{ url: currentProject.cover_image_url, mediaType: "image" as const }] : []),
      ...(currentProject.portfolio_gallery ?? []).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)).map((item) => ({ url: item.image_url, mediaType: item.media_type ?? "image" as "image" | "video" })),
    ];
    return [...new Map(media.map((item) => [item.url, item])).values()];
  }, [currentProject]);

  useEffect(() => setImageIndex(0), [active]);
  useEffect(() => { activeProjectRef.current = active; }, [active]);
  useEffect(() => {
    if (items.length <= 1) return;
    let repeatTimer: number | undefined;
    const advanceProject = () => onChange((activeProjectRef.current + 1) % items.length);
    const holdTimer = window.setTimeout(() => {
      advanceProject();
      repeatTimer = window.setInterval(advanceProject, 4000);
    }, 3000);
    return () => {
      window.clearTimeout(holdTimer);
      if (repeatTimer !== undefined) window.clearInterval(repeatTimer);
    };
  }, [items.length, onChange]);

  if (!items.length || !currentProject) return null;
  const indexAt = (offset: number) => (active + offset + items.length) % items.length;
  const fallbackImage = "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative overflow-hidden pb-0 pt-4 md:py-12" style={{ perspective: "1600px" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-24 bg-gradient-to-r from-[#faf9f6] to-transparent md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-24 bg-gradient-to-l from-[#faf9f6] to-transparent md:w-40" />
      <div className="relative h-[470px] md:h-[690px]">
        {([-1, 0, 1] as const).map((offset) => {
          const projectIndex = indexAt(offset);
          const project = items[projectIndex];
          const isActive = offset === 0;
          const previewMedia = isActive
            ? (currentMedia[imageIndex] ?? { url: project.cover_image_url ?? fallbackImage, mediaType: "image" as const })
            : { url: project.cover_image_url ?? project.portfolio_gallery?.[0]?.image_url ?? fallbackImage, mediaType: project.cover_image_url ? "image" as const : project.portfolio_gallery?.[0]?.media_type ?? "image" as const };
          return (
            <motion.article
              key={project.id}
              data-project-id={project.id}
              data-carousel-position={offset}
              className={`absolute left-1/2 top-0 w-[78vw] max-w-[780px] cursor-pointer overflow-hidden rounded-3xl border bg-white shadow-[0_28px_90px_rgba(15,23,42,.18)] outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${isActive ? "z-20 border-slate-200" : "z-10 border-white/70"}`}
              initial={false}
              animate={{
                x: offset === -1 ? "-118%" : offset === 1 ? "18%" : "-50%",
                y: isActive ? 0 : 58,
                scale: isActive ? 1 : 0.76,
                rotateY: offset === -1 ? 24 : offset === 1 ? -24 : 0,
                opacity: isActive ? 1 : 0.58,
                filter: isActive ? "blur(0px)" : "blur(1px)",
              }}
              transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => isActive ? onOpen(project) : onChange(projectIndex)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                isActive ? onOpen(project) : onChange(projectIndex);
              }}
              role="button"
              tabIndex={0}
              aria-label={isActive ? `Open ${project.name} details` : `Show ${project.name}`}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                <AnimatePresence mode="popLayout" initial={false}>
                  {previewMedia.mediaType === "video"
                    ? <motion.video key={previewMedia.url} src={previewMedia.url} muted loop autoPlay={isActive} playsInline preload="metadata" className="absolute inset-0 h-full w-full bg-black object-contain" initial={reduceMotion ? false : { opacity: 0, scale: 1.06, x: 28 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, x: -28 }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }} />
                    : <motion.img
                        key={previewMedia.url}
                        src={previewMedia.url}
                        alt={project.name}
                        loading={isActive ? "eager" : "lazy"}
                        decoding="async"
                        className="absolute inset-0 h-full w-full bg-slate-900 object-contain"
                        initial={reduceMotion ? false : { opacity: 0, scale: 1.06, x: 28 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, x: -28 }}
                        transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                      />}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                {isActive && currentMedia.length > 1 && <div className="absolute right-5 top-5 z-10 rounded-full border border-white/25 bg-slate-950/45 px-3 py-1.5 text-[10px] font-semibold tabular-nums tracking-[0.16em] text-white backdrop-blur">{String(imageIndex + 1).padStart(2, "0")} / {String(currentMedia.length).padStart(2, "0")}</div>}
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-accent">{offset === -1 ? "Previous project" : offset === 1 ? "Next project" : project.category || "Featured project"}</div>
                  <h3 className={`${isActive ? "mt-2 text-3xl md:text-4xl" : "mt-1 text-2xl"} font-medium leading-none`}>{project.name}</h3>
                </div>
                {isActive && currentMedia.length > 1 && (
                  <>
                    <button type="button" onClick={(event) => { event.stopPropagation(); setImageIndex((index) => (index - 1 + currentMedia.length) % currentMedia.length); }} className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-slate-950/40 text-white backdrop-blur transition hover:bg-white hover:text-slate-950" aria-label="Previous project media"><ChevronLeft className="h-5 w-5" /></button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); setImageIndex((index) => (index + 1) % currentMedia.length); }} className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-slate-950/40 text-white backdrop-blur transition hover:bg-white hover:text-slate-950" aria-label="Next project media"><ChevronRight className="h-5 w-5" /></button>
                  </>
                )}
              </div>
              {isActive && (
                <div className="p-5 md:p-7">
                  <div>
                    <p className="text-sm leading-6 text-slate-500">{project.location}</p>
                    {project.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{project.description}</p>}
                    {currentMedia.length > 1 && (
                      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label={`Media ${imageIndex + 1} of ${currentMedia.length}`}>
                        {currentMedia.map((media, index) => <button key={media.url} type="button" onClick={(event) => { event.stopPropagation(); setImageIndex(index); }} className={`relative h-12 w-20 shrink-0 overflow-hidden border-2 bg-slate-900 transition-all ${index === imageIndex ? "border-brand-primary opacity-100" : "border-transparent opacity-50 hover:opacity-90"}`} aria-label={`Show project media ${index + 1}`}>{media.mediaType === "video" ? <video src={media.url} muted preload="metadata" className="h-full w-full object-contain" /> : <img src={media.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />}</button>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
      <div className="relative z-40 mt-3 flex items-center justify-center gap-4 border-t border-slate-200/80 pt-4 md:mt-6 md:pt-6">
        <button type="button" onClick={() => onChange(indexAt(-1))} className="grid h-12 w-12 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:text-brand-primary" aria-label="Previous project"><ChevronLeft className="h-5 w-5" /></button>
        <span className="min-w-16 text-center text-xs font-semibold tabular-nums text-slate-500">{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => onChange(indexAt(1))} className="grid h-12 w-12 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:text-brand-primary" aria-label="Next project"><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function TestimonialCarousel({ items, autoplaySeconds }: { items: PublicTestimonial[]; autoplaySeconds: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const safeItems = items.length ? items : demoTestimonials;
  const testimonial = safeItems[active % safeItems.length];
  const previousTestimonial = safeItems[(active - 1 + safeItems.length) % safeItems.length];
  const nextTestimonial = safeItems[(active + 1) % safeItems.length];
  const rating = Math.max(1, Math.min(5, testimonial.rating ?? 5));

  useEffect(() => {
    if (paused || videoOpen || safeItems.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % safeItems.length);
    }, autoplaySeconds * 1000);
    return () => window.clearInterval(timer);
  }, [active, autoplaySeconds, paused, safeItems.length, videoOpen]);

  useEffect(() => {
    if (!videoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setVideoOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [videoOpen]);

  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white md:py-28" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 grid gap-6 border-l border-brand-accent/50 pl-5 md:grid-cols-[1fr_auto] md:items-end md:pl-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-accent">Client stories</div>
            <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-none tracking-[-0.03em] md:text-6xl">Voices behind<br />the spaces.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 md:text-base">Experiences from clients who trusted AMK with design, coordination, and delivery.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setActive((current) => (current - 1 + safeItems.length) % safeItems.length)} disabled={safeItems.length <= 1} className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition hover:border-brand-accent hover:bg-brand-accent hover:text-slate-950 disabled:opacity-30" aria-label="Previous testimonial"><ChevronLeft className="h-5 w-5" /></button>
            <span className="min-w-16 text-center text-xs font-semibold tabular-nums text-slate-400">{String((active % safeItems.length) + 1).padStart(2, "0")} / {String(safeItems.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => setActive((current) => (current + 1) % safeItems.length)} disabled={safeItems.length <= 1} className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition hover:border-brand-accent hover:bg-brand-accent hover:text-slate-950 disabled:opacity-30" aria-label="Next testimonial"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="relative py-6 md:py-10">
          {safeItems.length > 1 && (
            <>
              <button type="button" onClick={() => setActive((current) => (current - 1 + safeItems.length) % safeItems.length)} className="absolute left-0 top-1/2 z-0 hidden w-[34%] -translate-x-1/3 -translate-y-1/2 border border-white/10 bg-white/[.06] p-8 text-left opacity-55 lg:block" style={{ maskImage: "linear-gradient(to right, transparent, black 48%, black)" }} aria-label={`Show ${previousTestimonial.name}'s testimonial`}>
                <p className="line-clamp-3 text-lg leading-8 text-slate-300">“{previousTestimonial.quote}”</p>
                <div className="mt-5 text-sm font-semibold text-white">{previousTestimonial.name}</div>
              </button>
              <button type="button" onClick={() => setActive((current) => (current + 1) % safeItems.length)} className="absolute right-0 top-1/2 z-0 hidden w-[34%] translate-x-1/3 -translate-y-1/2 border border-white/10 bg-white/[.06] p-8 text-left opacity-55 lg:block" style={{ maskImage: "linear-gradient(to left, transparent, black 48%, black)" }} aria-label={`Show ${nextTestimonial.name}'s testimonial`}>
                <p className="line-clamp-3 text-lg leading-8 text-slate-300">“{nextTestimonial.quote}”</p>
                <div className="mt-5 text-sm font-semibold text-white">{nextTestimonial.name}</div>
              </button>
            </>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-slate-950 to-transparent md:w-44" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-slate-950 to-transparent md:w-44" />

          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={testimonial.id}
              initial={{ opacity: 0, x: 90, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -90, scale: 0.94 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className={`relative z-10 mx-auto grid max-w-5xl overflow-hidden bg-[#f5f1e8] text-slate-950 shadow-[0_35px_100px_rgba(0,0,0,.35)] ${testimonial.video_url ? "lg:grid-cols-[1.05fr_.95fr]" : ""}`}
            >
              {testimonial.video_url && (
                <button type="button" onClick={() => setVideoOpen(true)} className="group relative min-h-80 overflow-hidden bg-slate-900 text-white lg:min-h-[520px]" aria-label={`Play ${testimonial.name}'s testimonial video`}>
                  <video src={testimonial.video_url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-60" />
                  <span className="absolute inset-0 grid place-items-center bg-gradient-to-t from-slate-950/65 via-transparent to-transparent">
                    <span className="grid h-20 w-20 place-items-center rounded-full border border-white/40 bg-white/95 text-slate-950 shadow-2xl transition duration-500 group-hover:scale-110"><Play className="ml-1 h-7 w-7 fill-current" /></span>
                  </span>
                  <span className="absolute bottom-6 left-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">Watch their story</span>
                </button>
              )}
              <div className="flex min-h-[420px] flex-col p-7 md:p-10 lg:p-12">
                <div className="flex gap-1 text-brand-primary">
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < rating ? "fill-current" : "text-slate-300"}`} />)}
                </div>
                <div className="mt-7 text-7xl font-light leading-none text-brand-primary/25">“</div>
                <p className="-mt-5 text-2xl font-normal leading-9 text-slate-700 md:text-3xl md:leading-10">{testimonial.quote}</p>
                <div className="mt-auto flex items-center gap-4 border-t border-slate-300 pt-6">
                  {testimonial.avatar_url ? <img src={testimonial.avatar_url} alt={testimonial.name} loading="lazy" decoding="async" className="h-14 w-14 rounded-full object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-semibold text-brand-primary">{testimonial.name.charAt(0)}</div>}
                  <div>
                    <div className="text-lg font-semibold text-slate-950">{testimonial.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {videoOpen && testimonial.video_url && (
          <motion.div
            className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/90 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && setVideoOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="testimonial-video-title"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="w-full max-w-5xl overflow-hidden rounded-xl bg-slate-950 shadow-2xl ring-1 ring-white/10"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white sm:px-5">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide text-brand-accent">Video testimonial</div>
                  <h2 id="testimonial-video-title" className="truncate text-lg font-semibold">{testimonial.name}</h2>
                </div>
                <button type="button" onClick={() => setVideoOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-200 hover:bg-white/10 hover:text-white" aria-label="Close testimonial video">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <video src={testimonial.video_url} controls autoPlay playsInline preload="metadata" className="max-h-[78vh] w-full bg-black object-contain" aria-label={`${testimonial.name} testimonial video`} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function HomePage() {
  const { data: services = [] } = useTable("services", { limit: 6, orderBy: "created_at", eq: { status: "published" } });
  const { data: rawProjects = [] } = useTable("portfolio_projects", { limit: 6, orderBy: "display_order", eq: { status: "published" } });
  const { data: projectCategories = [] } = useTable("portfolio_categories", { orderBy: "display_order", ascending: true });
  const { data: projectGallery = [] } = useTable("portfolio_gallery", { orderBy: "display_order", ascending: true });
  const projectCategoryNames = new Map((projectCategories as Array<{ id: string; name: string }>).map((category) => [category.id, category.name]));
  const projects: PublicProject[] = (rawProjects as Array<{ id: string; title: string; short_description?: string | null; category_id?: string | null; location?: string | null; cover_image_url?: string | null; slug: string }>).map((p) => ({
    id: p.id,
    name: p.title,
    slug: p.slug,
    description: p.short_description,
    category: p.category_id ? projectCategoryNames.get(p.category_id) : undefined,
    location: p.location,
    cover_image_url: p.cover_image_url,
    portfolio_gallery: (projectGallery as Array<PublicProjectGalleryImage & { portfolio_project_id: string }>).filter((image) => image.portfolio_project_id === p.id),
  }));
  const { data: testimonials = [] } = useTable("testimonials", { limit: 6, orderBy: "display_order", ascending: true, eq: { is_published: true } });
  const { data: testimonialSettings = [] } = useTable("app_settings", { eq: { key: "testimonial_carousel" }, limit: 1 });
  const { data: banners = [] } = useTable("banners", { orderBy: "display_order", ascending: true, eq: { is_active: true } });
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const serviceRows = mergeServiceRows(services as typeof demoServices);
  const projectRows = projects;
  const testimonialRows = testimonials.length ? testimonials : demoTestimonials;
  const testimonialInterval = testimonialAutoplaySeconds(testimonialSettings[0]?.value);
  const bannerRows = banners.length ? banners : demoBanners;
  const slide = bannerRows[activeSlide % bannerRows.length];
  const slideImageUrl = slide.image_url ?? demoBanners[0].image_url;
  const nextSlide = bannerRows[(activeSlide + 1) % bannerRows.length];
  const nextSlideImageUrl = nextSlide?.image_url ?? demoBanners[0].image_url;
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % bannerRows.length), 5500);
    return () => window.clearInterval(timer);
  }, [bannerRows.length]);
  useEffect(() => {
    let preload = document.head.querySelector<HTMLLinkElement>('link[data-amk-hero-preload="true"]');
    if (!preload) {
      preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "image";
      preload.setAttribute("data-amk-hero-preload", "true");
      document.head.appendChild(preload);
    }
    preload.href = slideImageUrl;
    preload.setAttribute("fetchpriority", "high");
    const nextImage = new Image();
    nextImage.decoding = "async";
    nextImage.src = nextSlideImageUrl;
    return () => preload?.remove();
  }, [slideImageUrl, nextSlideImageUrl]);
  return (
    <>
      <Seo
        title="Architects in Mysuru | AMK Architects & Engineers"
        description="AMK Architects & Engineers is a Mysuru studio for architecture, interiors, BIM, parametric design, visualization, structural coordination, and project execution."
        keywords={["architects in Mysuru", "architecture firm Mysuru", "BIM modelling India", "parametric design architecture", "3D visualization Mysuru", "structural engineering Karnataka", "interior design Mysuru", "project execution India", "construction documentation", "master planning Mysuru"]}
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ArchitecturalOrganization",
          name: "AMK Architects & Engineers",
          description: "Technology-driven architecture and engineering studio in Mysuru.",
          url: "https://www.amkarchitects.in",
          telephone: "+91-98458-99066",
          address: { "@type": "PostalAddress", addressLocality: "Mysuru", addressRegion: "Karnataka", addressCountry: "IN" },
          knowsAbout: ["Architecture", "BIM", "Parametric Design", "3D Visualization", "Structural Engineering", "Interior Design", "Project Management"],
        }}
      />
      <section className="relative min-h-[760px] overflow-hidden bg-slate-950 px-4 py-16 text-white">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.76) 46%, rgba(2,6,23,0.24) 100%), linear-gradient(180deg, rgba(2,6,23,0.05), rgba(2,6,23,0.82)), url(${slideImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div className="absolute bottom-0 left-[8%] top-0 w-px bg-white/15" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.2 }} />
        <motion.div className="absolute bottom-0 right-[8%] top-0 w-px bg-white/15" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.2, delay: 0.1 }} />

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div className="max-w-4xl border-l border-white/20 pl-5 md:pl-10">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-accent">
              <span className="tabular-nums">{String(activeSlide % bannerRows.length + 1).padStart(2, "0")}</span><span className="h-px w-12 bg-brand-accent" /> Technology Driven Studio
            </motion.div>
            <motion.h1 key={slide.title} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="mt-8 max-w-4xl text-5xl font-medium leading-[0.94] tracking-[-0.04em] md:text-7xl xl:text-[5.6rem]">{slide.title}</motion.h1>
            {slide.subtitle && <motion.p key={`${slide.id}-subtitle`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12 }} className="mt-7 max-w-2xl whitespace-pre-line text-base font-light leading-8 text-slate-300 md:text-lg">{slide.subtitle}</motion.p>}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22 }} className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => location.href = "/projects"}
                className="group inline-flex min-w-40 items-center justify-center gap-2 rounded-sm bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-1 hover:bg-brand-accent"
              >
                View Projects <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => location.href = "/login"}
                className="group inline-flex min-w-40 items-center justify-center gap-2 rounded-sm border border-white/50 bg-transparent px-6 py-4 text-sm font-semibold text-white transition duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-slate-950"
              >
                <LogIn className="h-4 w-4" /> Login
              </button>
              <button
                type="button"
                onClick={openEnquiryModal}
                className="group inline-flex min-w-40 items-center justify-center gap-2 rounded-sm bg-brand-primary px-6 py-4 text-sm font-semibold text-white transition duration-300 hover:-translate-y-1 hover:brightness-110"
              >
                Get Started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: .2, ease: [0.22, 1, 0.36, 1] }} className="relative hidden self-end pb-10 lg:block">
            <div className="ml-auto w-72 border border-white/15 bg-slate-950/55 p-3 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[.2em] text-slate-400"><span>Next perspective</span><span>{String((activeSlide + 1) % bannerRows.length + 1).padStart(2, "0")}</span></div>
              <div className="relative aspect-[4/3] overflow-hidden"><img src={nextSlideImageUrl} alt="" className="h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" /></div>
              <div className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-white">{nextSlide?.title}</div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3 border border-white/10 bg-slate-950/45 px-4 py-3 backdrop-blur lg:left-[calc(50%-34rem)] lg:translate-x-0">
          {bannerRows.map((item, index) => (
            <button key={item.id} aria-label={`Go to slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide % bannerRows.length ? "w-12 bg-brand-primary" : "w-2.5 bg-white/45 hover:bg-white"}`} />
          ))}
        </div>
      </section>
      <Section title="End-to-End Design, Engineering & Construction Solutions" description="Architecture, engineering, BIM, visualization, and site support are planned as one connected studio service.">
        <ServiceExplorer items={serviceRows} />
      </Section>
      <Section id="featured-projects" title="Featured Projects" description="Explore selected architecture, interiors, and commercial work from the AMK portfolio.">
        {projectRows.length ? <ProjectCarousel3D items={projectRows as PublicProject[]} active={activeProjectIndex} onChange={setActiveProjectIndex} onOpen={setSelectedProject} /> : <EmptyState title="No featured projects yet" description="Published projects added from the admin portfolio will appear here." />}
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
      <TestimonialCarousel items={testimonialRows as PublicTestimonial[]} autoplaySeconds={testimonialInterval} />
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  );
}

export function ListingPage({ type }: { type: "projects" | "services" | "gallery" | "about" }) {
  const table = type === "services" ? "services" : type === "gallery" ? "gallery" : "portfolio_projects";
  const { data = [] } = useTable(table as never, { orderBy: type === "gallery" ? "display_order" : "created_at", ascending: type === "gallery", eq: type === "projects" || type === "services" ? { status: "published" } : undefined });
  const { data: aboutPages = [] } = useTable("website_pages", { eq: { slug: "about", status: "published" }, limit: 1 });
  const [filter, setFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [preview, setPreview] = useState<PublicGallery | null>(null);
  const fallbackRows = type === "services" ? demoServices : demoGallery;
  const sourceRows = type === "services" ? mergeServiceRows(data as typeof demoServices) : type === "gallery" ? (data.length ? data : fallbackRows) : data;
  const rows = useMemo(() => sourceRows.filter((item: { name?: string; title?: string; category?: string }) => `${item.name ?? item.title ?? ""} ${item.category ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [sourceRows, filter]);
  const aboutPage = aboutPages[0];
  if (type === "about") return (
    <>
      <Seo
        title="About AMK | Architecture & BIM Studio in Mysuru"
        description="Meet AMK Architects & Engineers, a Mysuru architecture studio integrating BIM, parametric design, visualization, digital fabrication, engineering, and project delivery."
        keywords={["about AMK Architects", "Mysuru architecture studio", "technology-driven architecture India", "BIM architecture Mysuru", "parametric design studio", "digital fabrication architecture", "computational design India"]}
        canonical="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About AMK Architects & Engineers",
          description: "Technology-driven architecture and engineering studio in Mysuru integrating BIM, parametric design, visualization, digital fabrication, and project delivery.",
          url: "https://www.amkarchitects.in/about",
        }}
      />
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
        <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <Card className="mx-auto w-full max-w-md overflow-hidden p-0">
            <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-orange-50 to-slate-100">
              {aboutPage?.image_url ? (
                <img src={aboutPage.image_url} alt="Ar. Andra Manoj Kumar, founder of AMK Architects & Engineers" loading="eager" decoding="async" className="h-full w-full object-cover object-top" />
              ) : (
                <div className="grid h-full place-items-center text-brand-primary">
                  <Sparkles className="h-14 w-14" />
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-black text-slate-950">Ar. Andra Manoj Kumar</h3>
              <p className="mt-2 text-sm font-semibold text-brand-primary">Architect | Computational Designer | BIM Specialist | Architectural Photographer</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">The studio is shaped around design clarity, BIM coordination, realistic visualization, and construction-ready decision making.</p>
            </div>
          </Card>
          <Card>
            <p className="text-lg leading-8 text-slate-600">Architecture today demands more than drawings. It requires technology, data, visualization, and execution expertise working together. AMK creates spaces that are intelligent, efficient, sustainable, and timeless.</p>
          </Card>
        </div>
      </Section>
      <Section title="Our Philosophy">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <h3 className="text-2xl font-black">Design should not only look exceptional; it should perform exceptionally.</h3>
          </Card>
          <div>
            <p className="mb-4 text-sm leading-7 text-slate-500">Open each idea to see how it affects project decisions, documentation, and site execution.</p>
            <InteractiveAccordion items={[
              { title: "Collaborative discovery", text: "Every project begins with a deep understanding of the client's vision and evolves through a collaborative process that integrates design thinking, data-driven decisions, and technical expertise.", meta: "Idea 01" },
              { title: "Performance-led design", text: "Plans, materials, services, structure, and approval constraints are tested against real project outcomes so the design works beyond presentation visuals.", meta: "Idea 02" },
              { title: "Execution continuity", text: "From concept development and approvals to execution and delivery, AMK remains committed to creating spaces that inspire, function, and endure.", meta: "Idea 03" }
            ]} />
          </div>
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
    </>
  );
  if (type === "projects") return (
    <>
      <Seo
        title="Architecture Projects in Mysuru | AMK Architects & Engineers Portfolio"
        description="View AMK Architects & Engineers project portfolio including Mysuru residences, commercial studios, interiors, approvals, and architecture project management."
        keywords={["architecture projects Mysuru", "residential architecture India", "commercial architecture Karnataka", "interior design projects Mysuru", "architecture portfolio", "building design Mysuru"]}
        canonical="/projects"
      />
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
      <Seo
        title="Architecture & BIM Services Mysuru | AMK"
        description="Explore AMK services in Mysuru: architecture, master planning, interiors, BIM, parametric design, engineering, visualization, fabrication, and execution support."
        keywords={["architecture services Mysuru", "BIM services India", "parametric design services", "master planning Karnataka", "interior design services Mysuru", "3D visualization architecture", "structural engineering Mysuru", "construction documentation", "project management Mysuru", "digital fabrication India"]}
        canonical="/services"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Architecture & Engineering",
          provider: { "@type": "ArchitecturalOrganization", name: "AMK Architects & Engineers", url: "https://www.amkarchitects.in" },
          areaServed: { "@type": "City", name: "Mysuru" },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Architecture & Engineering Services",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Architecture & Master Planning" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "BIM & Digital Engineering" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Parametric Design" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Interior Design" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "3D Visualization" } },
            ],
          },
        }}
      />
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
              <motion.div id={serviceKey(service)} key={service.id} className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.05 }} whileHover={{ y: -4 }}>
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="group relative min-h-72 overflow-hidden bg-slate-200">
                    <img src={service.image_url ?? "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"} alt={service.name ?? "AMK architecture service"} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
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
      <Seo
        title="Architecture & Interior Gallery Mysuru | AMK"
        description="Explore AMK project galleries featuring Mysuru residences, elevations, interiors, workspaces, material palettes, construction details, and approval drawings."
        keywords={["architecture gallery Mysuru", "project gallery India", "residential elevation photos", "interior design gallery Karnataka", "architecture photos Mysuru", "building design images"]}
        canonical="/gallery"
      />
      <Section title="Project Gallery Albums" description="Residential, commercial, interior, material, and documentation visuals from AMK projects.">
        <Input className="mb-6 max-w-md" aria-label="Gallery filter" value={filter} onChange={(event) => setFilter(event.target.value)} />
        <div className="grid gap-5 md:grid-cols-3">{rows.map((item) => {
          const gallery = item as PublicGallery;
          return <button key={gallery.id} className="text-left" onClick={() => setPreview(gallery)}><HoverRevealTile title={gallery.title} text={gallery.description ?? "Open this album for a focused project image preview."} image={gallery.image_url} label={gallery.category ?? "Gallery"} /></button>;
        })}</div>
      </Section>
      {preview && <GalleryPreview item={preview} onClose={() => setPreview(null)} />}
    </>
  );
  return (
    <Section title={type}>
      <Input className="mb-6 max-w-md" aria-label={`${type} filter`} value={filter} onChange={(event) => setFilter(event.target.value)} />
      <div className="grid gap-5 md:grid-cols-3">{rows.length ? rows.map((item: { id: string; name?: string; title?: string; description?: string; image_url?: string; cover_image_url?: string; slug?: string }) => <Card key={item.id} className="overflow-hidden p-0"><div className="aspect-[4/3] bg-slate-200"><img src={item.image_url ?? item.cover_image_url ?? "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80"} alt={item.name ?? item.title ?? "AMK project"} loading="lazy" decoding="async" className="h-full w-full object-cover" /></div><div className="p-5"><h3 className="font-bold">{item.name ?? item.title}</h3><p className="mt-2 text-sm text-slate-500">{item.description}</p>{item.slug && <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary" to={`/${type}/${item.slug}`}>Details <ArrowRight className="h-4 w-4" /></Link>}</div></Card>) : <EmptyState title={`No ${type} records`} description="Publish records from the CRM to populate this page." />}</div>
    </Section>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const { data: projects = [] } = useTable("portfolio_projects", { eq: { slug: slug ?? "", status: "published" } });
  const rawProject = projects[0] as { id: string; title?: string; name?: string; short_description?: string | null; description?: string | null; location?: string | null; cover_image_url?: string | null } | undefined;
  const project: PublicProject | undefined = rawProject ? { id: rawProject.id, name: rawProject.title ?? rawProject.name ?? "", description: rawProject.short_description ?? rawProject.description, location: rawProject.location, cover_image_url: rawProject.cover_image_url } : undefined;
  if (!project) return <><Seo title="Project Not Found | AMK Architects & Engineers" description="The requested AMK Architects & Engineers project is not published or does not exist." noIndex /><Section title="Project not found"><EmptyState title="No project found" description="The requested project is not published or does not exist." /></Section></>;
  return <><Seo title={`${project.name} | AMK Architects Mysuru Project`} description={`${project.name} by AMK Architects & Engineers in ${project.location ?? "Mysuru"}. View architecture project details, scope, and design approach.`} keywords={[`${project.name} Mysuru`, "architecture project", project.location ?? "Mysuru", "AMK Architects project", "architecture design Mysuru"]} canonical={`/projects/${slug ?? ""}`} ogImage={project.cover_image_url ?? undefined} ogType="article" jsonLd={{ "@context": "https://schema.org", "@type": "CreativeWork", name: project.name, description: project.description ?? `${project.name} by AMK Architects & Engineers`, creator: { "@type": "ArchitecturalOrganization", name: "AMK Architects & Engineers" }, contentLocation: { "@type": "Place", name: project.location ?? "Mysuru" } }} /><Section title={project.name}><Card><div className="aspect-video rounded-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${project.cover_image_url ?? ""})` }} /><p className="mt-6 leading-7 text-slate-600">{project.description}</p><p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" />{project.location}</p></Card></Section></>;
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
      <Seo
        title="Contact Architects in Mysuru | AMK Architects"
        description="Contact AMK Architects & Engineers in Mysuru for residential and commercial design, interiors, BIM, approval drawings, engineering, and execution support."
        keywords={["contact architects Mysuru", "architecture enquiry Karnataka", "residential design Mysuru", "approval drawings Mysuru", "structural coordination India", "architecture consultation Mysuru"]}
        canonical="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact AMK Architects & Engineers",
          description: "Contact AMK Architects & Engineers in Mysuru for architecture, BIM, interiors, and engineering enquiries.",
          url: "https://www.amkarchitects.in/contact",
        }}
      />
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
                <div className="mt-3 text-lg font-semibold leading-7 text-white">{value}</div>
              </div>
            ))}
            <a href={`https://wa.me/${branding.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-5 text-emerald-100 transition hover:bg-emerald-500/20 sm:col-span-2">
              <span>
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-400">WhatsApp</span>
                <span className="mt-2 block text-lg font-semibold">Chat with AMK about your project</span>
              </span>
              <FaWhatsapp className="h-8 w-8 shrink-0 text-emerald-400" aria-hidden="true" />
            </a>
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
