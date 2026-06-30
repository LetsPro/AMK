import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Eye, ExternalLink, Globe, Image, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TableRow } from "@/types/database";

type PortfolioProject = TableRow<"portfolio_projects"> & { category?: TableRow<"portfolio_categories"> | null };
type PortfolioCategory = TableRow<"portfolio_categories">;

type FormData = {
  title: string;
  slug: string;
  short_description: string;
  detailed_description: string;
  client_name: string;
  category_id: string;
  location: string;
  completion_date: string;
  cover_image_url: string;
  website_url: string;
  status: "draft" | "published";
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  services_provided: string;
  technologies_used: string;
};

const defaultForm: FormData = { title: "", slug: "", short_description: "", detailed_description: "", client_name: "", category_id: "", location: "", completion_date: "", cover_image_url: "", website_url: "", status: "draft", is_featured: false, seo_title: "", seo_description: "", services_provided: "", technologies_used: "" };

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function PortfolioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { profile } = useAuth();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<PortfolioProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioProject | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [previewProject, setPreviewProject] = useState<PortfolioProject | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function uploadCoverImage(file: globalThis.File) {
    setUploadingImage(true);
    const path = `portfolio/${Date.now()}_${file.name}`;
    const { data: uploaded, error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
    if (error) { toast.error("Upload failed", error.message); setUploadingImage(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(uploaded.path);
    setForm((f) => ({ ...f, cover_image_url: publicUrl }));
    setUploadingImage(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from("portfolio_projects").select("*, category:portfolio_categories(*)").order("display_order").order("created_at", { ascending: false }),
      supabase.from("portfolio_categories").select("*").order("display_order"),
    ]);
    setProjects((pRes.data as PortfolioProject[]) ?? []);
    setCategories((cRes.data as PortfolioCategory[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (searchParams.get("new") === "1") { openAdd(); setSearchParams({}); }
  }, [searchParams, setSearchParams]);

  const filtered = projects.filter((p) => statusFilter === "all" || p.status === statusFilter);

  function openAdd() { setEditProject(null); setForm(defaultForm); setShowForm(true); }
  function openEdit(p: PortfolioProject) {
    setEditProject(p);
    setForm({
      title: p.title, slug: p.slug, short_description: p.short_description ?? "", detailed_description: p.detailed_description ?? "",
      client_name: p.client_name ?? "", category_id: p.category_id ?? "", location: p.location ?? "", completion_date: p.completion_date ?? "",
      cover_image_url: p.cover_image_url ?? "", website_url: p.website_url ?? "", status: p.status, is_featured: p.is_featured,
      seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
      services_provided: (p.services_provided ?? []).join(", "),
      technologies_used: (p.technologies_used ?? []).join(", "),
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      services_provided: form.services_provided ? form.services_provided.split(",").map((s) => s.trim()).filter(Boolean) : [],
      technologies_used: form.technologies_used ? form.technologies_used.split(",").map((s) => s.trim()).filter(Boolean) : [],
      category_id: form.category_id || null,
      updated_by: profile?.id,
    };
    try {
      if (editProject) {
        const { error } = await supabase.from("portfolio_projects").update(payload).eq("id", editProject.id);
        if (error) throw error;
        toast.success("Project updated");
      } else {
        const { error } = await supabase.from("portfolio_projects").insert({ ...payload, created_by: profile?.id });
        if (error) throw error;
        toast.success("Project created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error("Error", err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function togglePublish(project: PortfolioProject) {
    const newStatus = project.status === "published" ? "draft" : "published";
    await supabase.from("portfolio_projects").update({ status: newStatus }).eq("id", project.id);
    toast.success(`Project ${newStatus === "published" ? "published" : "unpublished"}`);
    load();
  }

  async function toggleFeatured(project: PortfolioProject) {
    await supabase.from("portfolio_projects").update({ is_featured: !project.is_featured }).eq("id", project.id);
    load();
  }

  async function deleteProject() {
    if (!deleteTarget) return;
    await supabase.from("portfolio_projects").delete().eq("id", deleteTarget.id);
    toast.success("Project deleted");
    setDeleteTarget(null);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Portfolio</h1>
          <p className="text-sm text-slate-500">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Project</Button>
      </div>

      <div className="flex gap-1.5">
        {(["all", "published", "draft"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors capitalize", statusFilter === s ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50")}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Image className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <p className="font-semibold text-slate-600">No portfolio projects yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="h-4 w-4" /> Add Project</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <div key={project.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {project.cover_image_url ? (
                  <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300"><Image className="h-12 w-12" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm", project.status === "published" ? "bg-emerald-500/90 text-white" : "bg-slate-700/90 text-white")}>{project.status}</span>
                  {project.is_featured && <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">★ Featured</span>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{project.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{project.category?.name ?? "No category"}{project.location ? ` · ${project.location}` : ""}</p>
                  </div>
                </div>
                {project.short_description && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{project.short_description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button onClick={() => setPreviewProject(project)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors"><Eye className="h-3.5 w-3.5" /> Preview</button>
                  <button onClick={() => openEdit(project)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => togglePublish(project)} className={cn("flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors", project.status === "published" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>
                    <Globe className="h-3.5 w-3.5" /> {project.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => toggleFeatured(project)} className={cn("flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors", project.is_featured ? "border-amber-200 bg-amber-50 text-amber-600" : "border-slate-200 hover:bg-slate-50")}><Star className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(project)} className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" onClick={() => setPreviewProject(null)}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {previewProject.cover_image_url && <img src={previewProject.cover_image_url} alt={previewProject.title} className="w-full aspect-video object-cover" />}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">{previewProject.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{previewProject.category?.name}{previewProject.location ? ` · ${previewProject.location}` : ""}</p>
                  </div>
                  <button onClick={() => setPreviewProject(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>
                {previewProject.short_description && <p className="mt-4 text-slate-600">{previewProject.short_description}</p>}
                {previewProject.detailed_description && <p className="mt-3 text-sm text-slate-500 leading-relaxed">{previewProject.detailed_description}</p>}
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {previewProject.client_name && <span><strong>Client:</strong> {previewProject.client_name}</span>}
                  {previewProject.completion_date && <span><strong>Completed:</strong> {previewProject.completion_date}</span>}
                </div>
                {previewProject.website_url && (
                  <a href={previewProject.website_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-sm text-brand-primary hover:underline"><ExternalLink className="h-4 w-4" /> View Project</a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setShowForm(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="font-bold text-lg">{editProject ? "Edit Project" : "Add Portfolio Project"}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Title *</label><Input value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) }); }} placeholder="Project title" /></div>
                <div><label className="block text-sm font-medium mb-1">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="auto-generated-from-title" /></div>
                <div><label className="block text-sm font-medium mb-1">Short Description</label><Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Brief summary for listings" /></div>
                <div><label className="block text-sm font-medium mb-1">Detailed Description</label><textarea value={form.detailed_description} onChange={(e) => setForm({ ...form, detailed_description: e.target.value })} className="h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" placeholder="Full project description" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Client Name</label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Category</label>
                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Completion Date</label><Input type="date" value={form.completion_date} onChange={(e) => setForm({ ...form, completion_date: e.target.value })} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Image</label>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadCoverImage(e.target.files[0]); }} />
                  {form.cover_image_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200">
                      <img src={form.cover_image_url} alt="cover" className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/40 opacity-0 hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Replace</button>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, cover_image_url: "" }))} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="flex h-32 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-primary/50 hover:text-brand-primary transition-colors disabled:opacity-50">
                      {uploadingImage ? <div className="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /> : <><Upload className="h-5 w-5" /><span className="text-sm font-medium">Upload cover image</span></>}
                    </button>
                  )}
                </div>
                <div><label className="block text-sm font-medium mb-1">Project URL</label><Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." /></div>
                <div><label className="block text-sm font-medium mb-1">Services (comma separated)</label><Input value={form.services_provided} onChange={(e) => setForm({ ...form, services_provided: e.target.value })} placeholder="Architecture, BIM, Interior Design" /></div>
                <div><label className="block text-sm font-medium mb-1">Technologies (comma separated)</label><Input value={form.technologies_used} onChange={(e) => setForm({ ...form, technologies_used: e.target.value })} placeholder="Revit, AutoCAD, 3ds Max" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 accent-brand-primary" />
                      <span className="text-sm font-medium">Featured</span>
                    </label>
                  </div>
                </div>
                <div><label className="block text-sm font-medium mb-1">SEO Title</label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">SEO Description</label><Input value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Saving..." : editProject ? "Update" : "Create"}</Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg">Delete Project?</h3>
              <p className="mt-2 text-sm text-slate-600">Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.</p>
              <div className="mt-5 flex gap-3">
                <Button variant="danger" onClick={deleteProject} className="flex-1">Delete</Button>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
