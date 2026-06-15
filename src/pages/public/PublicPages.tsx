import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-14"><h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>{children}</section>;
}

export function HomePage() {
  const { data: services = [] } = useTable("services", { limit: 6, orderBy: "created_at", eq: { status: "published" } });
  const { data: projects = [] } = useTable("projects", { limit: 6, orderBy: "created_at", eq: { published: true } });
  const { data: testimonials = [] } = useTable("testimonials", { limit: 3, orderBy: "created_at", eq: { is_published: true } });
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(135deg, #F86A0D, transparent 45%), url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative mx-auto max-w-7xl">
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">AMK Architects & Engineers</motion.h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">Integrated architecture, approvals, engineering, project execution, and client operations for residential and commercial developments.</p>
          <div className="mt-8 flex gap-3"><Button onClick={() => location.href = "/contact"}>Start a Project</Button><Button variant="secondary" onClick={() => location.href = "/projects"}>View Projects</Button></div>
        </div>
      </section>
      <Section title="Architecture and Engineering Services">
        <div className="grid gap-5 md:grid-cols-3">{services.length ? services.map((service) => <Card key={service.id}><CheckCircle2 className="mb-4 text-brand-primary" /><h3 className="font-bold">{service.name}</h3><p className="mt-2 text-sm text-slate-500">{service.description}</p></Card>) : <EmptyState title="Services will appear here" description="Publish service records from Website CMS to populate the website." />}</div>
      </Section>
      <Section title="Featured Projects">
        <div className="grid gap-5 md:grid-cols-3">{projects.length ? projects.map((project) => <Link key={project.id} to={`/projects/${project.slug}`}><Card className="p-0"><div className="aspect-[4/3] rounded-t-lg bg-slate-200 bg-cover" style={{ backgroundImage: `url(${project.cover_image_url ?? "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"})` }} /><div className="p-5"><h3 className="font-bold">{project.name}</h3><p className="text-sm text-slate-500">{project.location}</p></div></Card></Link>) : <EmptyState title="No featured projects" description="Publish project records to show them here." />}</div>
      </Section>
      <Section title="Performance">
        <div className="grid gap-5 md:grid-cols-4">{["Projects Delivered", "Design Disciplines", "Approval Workflows", "Client Touchpoints"].map((label, index) => <Card key={label}><div className="text-4xl font-black text-brand-primary">{[0, 0, 0, 0][index]}</div><div className="text-sm text-slate-500">{label}</div></Card>)}</div>
      </Section>
      <Section title="Client Testimonials">
        <div className="grid gap-5 md:grid-cols-3">{testimonials.length ? testimonials.map((item) => <Card key={item.id}><p className="text-slate-600">“{item.quote}”</p><div className="mt-4 font-bold">{item.name}</div></Card>) : <EmptyState title="No published testimonials" description="Publish testimonials in CMS to populate this section." />}</div>
      </Section>
      <ContactPage compact />
    </>
  );
}

export function ListingPage({ type }: { type: "projects" | "services" | "gallery" | "testimonials" | "about" }) {
  const table = type === "services" ? "services" : type === "gallery" ? "gallery" : type === "testimonials" ? "testimonials" : "projects";
  const { data = [] } = useTable(table as never, { orderBy: "created_at" });
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => data.filter((item: { name?: string; title?: string; category?: string }) => `${item.name ?? item.title ?? ""} ${item.category ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [data, filter]);
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
  const project = projects[0];
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
