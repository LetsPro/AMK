import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardCheck, Layers3, MapPin, Ruler, Send, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-14"><h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>{children}</section>;
}

const demoServices = [
  { id: "demo-service-1", name: "Architectural Design", slug: "architectural-design", description: "Concept planning, elevations, working drawings, and design coordination for Mysuru homes and commercial spaces.", image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-2", name: "Approval Drawings", slug: "approval-drawings", description: "Submission-ready approval drawings and documentation support for Mysuru and Karnataka projects.", image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" },
  { id: "demo-service-3", name: "Structural Engineering", slug: "structural-engineering", description: "Structural coordination and construction-ready technical documentation for residential and commercial work.", image_url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80" }
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
  { id: "demo-testimonial-1", name: "Raghavendra Rao", company: "Chamundi Hill Residence", quote: "AMK translated our requirements into a practical, elegant home design and kept every drawing revision clearly documented." },
  { id: "demo-testimonial-2", name: "Nandini Prakash", company: "Vijayanagar Courtyard Home", quote: "The team handled design, approvals, and site coordination with a professional process. Communication was consistent from start to finish." },
  { id: "demo-testimonial-3", name: "Mohammed Irfan", company: "Hebbal Workspace Studio", quote: "Our workspace plan was delivered with clear cost visibility and fast revisions. The Mysuru site constraints were handled well." }
];

const demoBanners = [
  {
    id: "demo-banner-1",
    title: "AMK Architects & Engineers",
    subtitle: "Integrated architecture, approvals, engineering, project execution, and client operations for residential and commercial developments in Mysuru.",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80",
    cta_label: "Start a Project",
    cta_url: "/contact"
  },
  {
    id: "demo-banner-2",
    title: "Design-Led Homes in Mysuru",
    subtitle: "From concept plans to approval drawings and site coordination, every project is managed with clear documentation.",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80",
    cta_label: "View Projects",
    cta_url: "/projects"
  },
  {
    id: "demo-banner-3",
    title: "Approvals, Billing, Projects, Support",
    subtitle: "Customers, documents, quotations, invoices, payments, and support history stay connected through the AMK platform.",
    image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80",
    cta_label: "Get Started",
    cta_url: "/customer-register"
  }
];

export function HomePage() {
  const { data: services = [] } = useTable("services", { limit: 6, orderBy: "created_at", eq: { status: "published" } });
  const { data: projects = [] } = useTable("projects", { limit: 6, orderBy: "created_at", eq: { published: true } });
  const { data: testimonials = [] } = useTable("testimonials", { limit: 3, orderBy: "created_at", eq: { is_published: true } });
  const { data: banners = [] } = useTable("banners", { orderBy: "created_at", ascending: true, eq: { is_active: true } });
  const [activeSlide, setActiveSlide] = useState(0);
  const serviceRows = services.length ? services : demoServices;
  const projectRows = projects.length ? projects : demoProjects;
  const testimonialRows = testimonials.length ? testimonials : demoTestimonials;
  const bannerRows = banners.length ? banners : demoBanners;
  const slide = bannerRows[activeSlide % bannerRows.length];
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % bannerRows.length), 5500);
    return () => window.clearInterval(timer);
  }, [bannerRows.length]);
  return (
    <>
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
      <Section title="From Concept to Completion">
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            ["Discover", "Site context, requirements, constraints, budget and approval route are mapped before design starts."],
            ["Design", "Architecture, structural coordination, interiors and engineering packages are developed together."],
            ["Approve", "Drawing sets, statutory documentation and client approvals are tracked with clear ownership."],
            ["Execute", "Milestones, tasks, budgets, vendors, invoices and support are managed through delivery."]
          ].map(([title, text], index) => (
            <Card key={title} className="relative overflow-hidden">
              <div className="absolute right-4 top-4 text-5xl font-black text-orange-100">{index + 1}</div>
              <h3 className="relative text-lg font-bold">{title}</h3>
              <p className="relative mt-3 text-sm leading-6 text-slate-500">{text}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section title="Architecture and Engineering Services">
        <div className="grid gap-5 md:grid-cols-3">{serviceRows.map((service) => <Card key={service.id}><CheckCircle2 className="mb-4 text-brand-primary" /><h3 className="font-bold">{service.name}</h3><p className="mt-2 text-sm text-slate-500">{service.description}</p></Card>)}</div>
      </Section>
      <Section title="Integrated Capabilities">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            [Ruler, "Design Intelligence", "Space planning, elevation studies, technical drawings and material direction."],
            [Layers3, "Engineering Coordination", "Structure, services and execution details aligned before site work begins."],
            [ClipboardCheck, "Approval Management", "Document registers, drawing submissions and follow-up accountability."],
            [ShieldCheck, "Client Assurance", "Transparent communication, billing, support and project history records."]
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
        <div className="grid gap-5 md:grid-cols-3">{projectRows.map((project) => <Link key={project.id} to={`/projects/${project.slug}`}><Card className="p-0"><div className="aspect-[4/3] rounded-t-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${project.cover_image_url ?? "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"})` }} /><div className="p-5"><h3 className="font-bold">{project.name}</h3><p className="text-sm text-slate-500">{project.location}</p></div></Card></Link>)}</div>
      </Section>
      <Section title="Sectors We Serve">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Residential Villas", "Custom homes, renovations, interiors, approvals and construction coordination."],
            ["Commercial Spaces", "Offices, retail, hospitality and mixed-use environments built for daily operations."],
            ["Institutional Projects", "Purpose-led planning, documentation and engineering for long-term facility use."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Performance">
        <div className="grid gap-5 md:grid-cols-4">{["Projects Delivered", "Design Disciplines", "Approval Workflows", "Client Touchpoints"].map((label, index) => <Card key={label}><div className="text-4xl font-black text-brand-primary">{[0, 12, 0, 24][index]}{index === 1 || index === 3 ? "+" : ""}</div><div className="text-sm text-slate-500">{label}</div></Card>)}</div>
      </Section>
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">A connected client experience after registration</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">When customers register, AMK can keep project discussions, approvals, documents, quotations, invoices, payments and support tickets connected to a single profile.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Customer profile", "Project history", "Approval documents", "Invoice tracking", "Support tickets", "Communication logs"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/5 p-4 text-sm font-semibold">{item}</div>
            ))}
          </div>
        </div>
      </section>
      <Section title="Client Testimonials">
        <div className="grid gap-5 md:grid-cols-3">{testimonialRows.map((item) => <Card key={item.id}><p className="text-slate-600">“{item.quote}”</p><div className="mt-4 font-bold">{item.name}</div><div className="text-sm text-slate-500">{item.company}</div></Card>)}</div>
      </Section>
      <ContactPage compact />
    </>
  );
}

export function ListingPage({ type }: { type: "projects" | "services" | "gallery" | "testimonials" | "about" }) {
  const table = type === "services" ? "services" : type === "gallery" ? "gallery" : type === "testimonials" ? "testimonials" : "projects";
  const { data = [] } = useTable(table as never, { orderBy: "created_at" });
  const [filter, setFilter] = useState("");
  const fallbackRows = type === "services" ? demoServices : type === "gallery" ? demoGallery : type === "testimonials" ? demoTestimonials : demoProjects;
  const sourceRows = data.length ? data : fallbackRows;
  const rows = useMemo(() => sourceRows.filter((item: { name?: string; title?: string; category?: string }) => `${item.name ?? item.title ?? ""} ${item.category ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [sourceRows, filter]);
  if (type === "about") return <Section title="About AMK Architects & Engineers"><Card><p className="leading-7 text-slate-600">AMK Architects & Engineers manages architecture, engineering approvals, execution coordination, client communication, and documentation through one integrated operations platform.</p></Card></Section>;
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
  return <Section title={project.name}><Card><div className="aspect-video rounded-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${project.cover_image_url ?? ""})` }} /><p className="mt-6 leading-7 text-slate-600">{project.description}</p><p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" />{project.location}</p></Card></Section>;
}

export function ContactPage({ compact = false }: { compact?: boolean }) {
  const { create } = useTableMutations("enquiries");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", subject: "", message: "" });
  return (
    <Section title="Contact Us">
      <div className="grid gap-6 md:grid-cols-2">
        <Card><h3 className="mb-4 font-bold">Send an enquiry</h3><form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); await create.mutateAsync({ ...form, source: "website" }); setForm({ name: "", email: "", mobile: "", subject: "", message: "" }); }}><Input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /><Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /><Textarea required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><Button disabled={create.isPending}><Send className="h-4 w-4" /> Submit</Button></form></Card>
        <Card><h3 className="mb-4 font-bold">Visit AMK</h3><div className="grid aspect-video place-items-center rounded-lg bg-slate-100 text-slate-500">Google Maps embed placeholder configured in Contact CMS</div><p className="mt-4 text-sm text-slate-500">Website enquiries are inserted into Supabase and converted to leads automatically by the database trigger.</p></Card>
      </div>
      {compact && <div className="mt-8 rounded-lg bg-gradient-to-r from-brand-primary to-brand-accent p-8 text-white"><h3 className="text-2xl font-bold">Ready to plan your next project?</h3><p className="mt-2">Share your requirements and the AMK team will follow up from CRM.</p></div>}
    </Section>
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
    <Section title="Customer Registration">
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
    </Section>
  );
}
