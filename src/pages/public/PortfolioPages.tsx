import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronDown, ExternalLink, MapPin, Sparkles, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TableRow } from "@/types/database";

type Project = TableRow<"portfolio_projects"> & {
  portfolio_categories: { name: string } | null;
  portfolio_gallery: { image_url: string; caption: string | null; display_order: number }[];
};

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-10">
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h1 className="mt-4 text-4xl font-black text-slate-900 sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-500">{text}</p>
    </motion.div>
  );
}

function PortfolioAccordion({ items }: { items: { title: string; text: string; meta: string }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {items.map((item, index) => (
        <div key={item.title} className="border-b border-slate-200 last:border-b-0">
          <button type="button" onClick={() => setActive(active === index ? -1 : index)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-orange-50/60">
            <span>
              <span className="text-xs font-black uppercase tracking-wide text-brand-primary">{item.meta}</span>
              <span className="mt-1 block font-bold text-slate-950">{item.title}</span>
            </span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${active === index ? "rotate-180 text-brand-primary" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {active === index && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{item.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function PortfolioCard({ project }: { project: Project }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.22 }}>
      <Link to={`/projects/${project.slug}`} className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-xl">
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center bg-slate-950/0 transition group-hover:bg-slate-950/40">
          <span className="translate-y-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">View Project</span>
        </div>
      </div>
      <div className="p-5">
        {project.portfolio_categories && (
          <span className="inline-block rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary mb-2">{project.portfolio_categories.name}</span>
        )}
        <h3 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{project.title}</h3>
        {project.short_description && <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{project.short_description}</p>}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
          {project.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>
          )}
          {project.completion_date && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(project.completion_date).getFullYear()}</span>
          )}
        </div>
      </div>
      </Link>
    </motion.div>
  );
}

export function PortfolioListingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: pData }, { data: cData }] = await Promise.all([
        supabase.from("portfolio_projects").select("*, portfolio_categories(name), portfolio_gallery(image_url,caption,display_order)").eq("status", "published").order("display_order"),
        supabase.from("portfolio_categories").select("id,name").order("display_order"),
      ]);
      setProjects((pData as Project[]) ?? []);
      setCategories((cData as { id: string; name: string }[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = activeCategory ? projects.filter((p) => p.category_id === activeCategory) : projects;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionIntro eyebrow="Portfolio" title="Our Projects" text="A showcase of architectural and engineering work across diverse sectors and scales." />

      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setActiveCategory("")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${!activeCategory ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50"}`}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeCategory === c.id ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50"}`}>{c.name}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No projects found.</div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <PortfolioCard key={p.id} project={p} />)}
        </motion.div>
      )}
    </div>
  );
}

export function PortfolioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: rawData } = await supabase.from("portfolio_projects").select("*, portfolio_categories(name), portfolio_gallery(image_url,caption,display_order)").eq("slug", slug).eq("status", "published").maybeSingle();
      const data = rawData as Project | null;
      setProject(data);
      if (data?.cover_image_url) setActiveImage(data.cover_image_url);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded bg-slate-200 w-2/3" />
          <div className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-slate-800">Project not found</h2>
        <Link to="/projects" className="mt-4 inline-flex items-center gap-1 text-brand-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to projects</Link>
      </div>
    );
  }

  const gallery = [...(project.portfolio_gallery ?? [])].sort((a, b) => a.display_order - b.display_order);
  const allImages = [project.cover_image_url, ...gallery.map((g) => g.image_url)].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-primary mb-8 transition-colors"><ArrowLeft className="h-4 w-4" /> All Projects</Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div>
          {/* Active image */}
          {activeImage && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-3">
              <img src={activeImage} alt={project.title} className="h-full w-full object-cover" />
            </motion.div>
          )}
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(img)} className={`shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all hover:-translate-y-1 ${activeImage === img ? "border-brand-primary" : "border-transparent"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-black text-slate-900 mb-2">{project.title}</h1>
          {project.short_description && <p className="text-lg text-slate-500 mb-6">{project.short_description}</p>}
          {project.detailed_description && (
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.detailed_description}</p>
            </div>
          )}
          <div className="mt-8">
            <PortfolioAccordion items={[
              { meta: "Focus 01", title: "Design intent", text: project.short_description || "The project is reviewed through its spatial intent, user needs, site context, and visual direction." },
              { meta: "Focus 02", title: "Coordination", text: "AMK connects architecture, services, structure, documentation, visualization, and site decisions through a coordinated delivery flow." },
              { meta: "Focus 03", title: "Outcome", text: "The final outcome is measured by clarity, buildability, material quality, usability, and long-term value." }
            ]} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            {project.client_name && (
              <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Client</span><p className="mt-0.5 font-semibold text-slate-800">{project.client_name}</p></div>
            )}
            {project.location && (
              <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Location</span><p className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{project.location}</p></div>
            )}
            {project.completion_date && (
              <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Completed</span><p className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" />{new Date(project.completion_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p></div>
            )}
            {project.portfolio_categories && (
              <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Category</span><p className="mt-0.5"><span className="inline-block rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">{project.portfolio_categories.name}</span></p></div>
            )}
            {project.services_provided && project.services_provided.length > 0 && (
              <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Services</span><div className="mt-1 flex flex-wrap gap-1">{project.services_provided.map((s) => <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{s}</span>)}</div></div>
            )}
            {project.website_url && (
              <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-brand-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" /> View Website</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
