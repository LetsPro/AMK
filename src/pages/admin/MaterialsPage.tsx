import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Clock3, Copy, FileText, Film, ImageIcon, Link2, Pencil, Plus, Share2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";
import { storageSafeFileName, uploadFile } from "@/services/crud";
import type { TableRow } from "@/types/database";

type Category = TableRow<"material_categories">;
type Recommendation = TableRow<"material_recommendations"> & { category: { name: string } | null };
type MaterialAttachment = { kind: "image" | "video" | "document"; url: string; name: string };

type RecommendationForm = {
  title: string;
  category_id: string;
  description: string;
  attachments: MaterialAttachment[];
  status: "draft" | "published";
};

const emptyForm: RecommendationForm = { title: "", category_id: "", description: "", attachments: [], status: "draft" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function MaterialsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const attachmentInput = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);
  const [form, setForm] = useState<RecommendationForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [shareTarget, setShareTarget] = useState<Recommendation | null>(null);
  const [shareDays, setShareDays] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  async function load() {
    const [{ data: categoryData }, { data: recommendationData }] = await Promise.all([
      supabase.from("material_categories").select("*").order("display_order").order("name"),
      supabase.from("material_recommendations").select("*, category:material_categories(name)").order("created_at", { ascending: false }),
    ]);
    setCategories((categoryData as Category[]) ?? []);
    setRecommendations((recommendationData as unknown as Recommendation[]) ?? []);
  }

  useEffect(() => { void load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, category_id: selectedCategory });
    setShowEditor(true);
  }

  function openEdit(item: Recommendation) {
    setEditing(item);
    setForm({
      title: item.title,
      category_id: item.category_id ?? "",
      description: item.description,
      attachments: Array.isArray(item.attachments)
        ? item.attachments.filter((value): value is MaterialAttachment => Boolean(value && typeof value === "object" && "kind" in value && "url" in value && "name" in value))
        : [],
      status: item.status,
    });
    setShowEditor(true);
  }

  async function saveCategory() {
    if (!categoryName.trim()) return;
    const wasEditing = Boolean(editingCategory);
    const payload = { name: categoryName.trim(), slug: `${slugify(categoryName)}-${editingCategory?.id.slice(0, 6) ?? Date.now()}`, description: categoryDescription.trim() || null, created_by: profile?.id ?? null };
    const { error } = editingCategory
      ? await supabase.from("material_categories").update(payload).eq("id", editingCategory.id)
      : await supabase.from("material_categories").insert({ ...payload, display_order: categories.length, is_active: true });
    if (error) { toast.error("Could not save category", error.message); return; }
    setCategoryName(""); setCategoryDescription(""); setEditingCategory(null);
    toast.success(wasEditing ? "Category updated" : "Category created");
    await load();
  }

  async function toggleCategory(category: Category) {
    await supabase.from("material_categories").update({ is_active: !category.is_active }).eq("id", category.id);
    await load();
  }

  async function deleteCategory(category: Category) {
    const { error } = await supabase.from("material_categories").delete().eq("id", category.id);
    if (error) { toast.error("Could not delete category", error.message); return; }
    if (selectedCategory === category.id) setSelectedCategory("");
    toast.success("Category deleted");
    await load();
  }

  async function uploadAttachments(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    setUploadingAttachments(true);
    setAttachmentProgress(0);
    const uploaded: MaterialAttachment[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const kind: MaterialAttachment["kind"] = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";
        setUploadStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        const path = `materials/${kind}s/${Date.now()}-${index}-${storageSafeFileName(file.name)}`;
        const url = await uploadFile("website", path, file, { onProgress: (progress) => setAttachmentProgress(Math.round(((index + progress / 100) / files.length) * 100)) });
        uploaded.push({ kind, url, name: file.name });
      }
      setForm((current) => ({ ...current, attachments: [...current.attachments, ...uploaded] }));
      toast.success(`${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error("Attachment upload failed", error instanceof Error ? error.message : "Could not upload attachments");
    } finally {
      setUploadingAttachments(false);
      setAttachmentProgress(0);
      setUploadStatus("");
      if (attachmentInput.current) attachmentInput.current.value = "";
    }
  }

  async function saveRecommendation() {
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and guidance are required"); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: `${slugify(form.title)}-${editing?.id.slice(0, 6) ?? Date.now()}`,
      category_id: form.category_id || null,
      description: form.description.trim(),
      attachments: form.attachments,
      document_url: form.attachments.find((item) => item.kind === "document")?.url ?? null,
      image_url: form.attachments.find((item) => item.kind === "image")?.url ?? null,
      video_url: form.attachments.find((item) => item.kind === "video")?.url ?? null,
      status: form.status,
      published_at: form.status === "published" ? editing?.published_at ?? new Date().toISOString() : null,
      updated_by: profile?.id ?? null,
      ...(!editing ? { created_by: profile?.id ?? null } : {}),
    };
    const { error } = editing
      ? await supabase.from("material_recommendations").update(payload).eq("id", editing.id)
      : await supabase.from("material_recommendations").insert(payload);
    setSaving(false);
    if (error) { toast.error("Could not save recommendation", error.message); return; }
    toast.success(form.status === "published" ? "Recommendation published" : "Draft saved");
    setShowEditor(false); setEditing(null); setForm(emptyForm);
    await load();
  }

  async function deleteRecommendation(item: Recommendation) {
    const { error } = await supabase.from("material_recommendations").delete().eq("id", item.id);
    if (error) { toast.error("Could not delete recommendation", error.message); return; }
    toast.success("Recommendation deleted");
    await load();
  }

  async function createShareLink() {
    if (!shareTarget) return;
    const days = shareDays.trim() ? Number(shareDays) : null;
    if (days !== null && (!Number.isFinite(days) || days <= 0)) { toast.error("Enter a valid number of days"); return; }
    const token = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = days === null ? null : new Date(Date.now() + days * 86_400_000).toISOString();
    const { error } = await supabase.from("material_share_links").insert({ recommendation_id: shareTarget.id, token, expires_at: expiresAt, created_by: profile?.id ?? null });
    if (error) { toast.error("Could not create share link", error.message); return; }
    const link = `${window.location.origin}/materials/${token}`;
    setGeneratedLink(link);
    await navigator.clipboard?.writeText(link).catch(() => undefined);
    toast.success("Share link created and copied");
  }

  const visibleRecommendations = selectedCategory ? recommendations.filter((item) => item.category_id === selectedCategory) : recommendations;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-black text-slate-950">Material Recommendations</h1><p className="mt-1 text-sm text-slate-500">Create complete, category-based guidance and share private time-limited links.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setShowCategories(true)}><BookOpen className="h-4 w-4" /> Manage categories</Button><Button onClick={openNew}><Plus className="h-4 w-4" /> New recommendation</Button></div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button onClick={() => setSelectedCategory("")} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${!selectedCategory ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>All materials <span className="ml-1 opacity-70">{recommendations.length}</span></button>
          {categories.filter((category) => category.is_active).map((category) => <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${selectedCategory === category.id ? "bg-brand-primary text-white" : "bg-orange-50 text-brand-primary hover:bg-orange-100"}`}>{category.name} <span className="ml-1 opacity-70">{recommendations.filter((item) => item.category_id === category.id).length}</span></button>)}
        </div>
        <section className="space-y-3">
          {visibleRecommendations.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-semibold text-slate-600">No recommendations in this category</p><Button onClick={openNew} className="mt-4"><Plus className="h-4 w-4" /> Create one</Button></div> : visibleRecommendations.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex gap-4 p-4">
                <div className="hidden h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:block">{item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><BookOpen className="h-8 w-8 text-slate-300" /></div>}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${item.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.status}</span>{item.category?.name && <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-brand-primary">{item.category.name}</span>}</div><h2 className="mt-3 text-xl font-black text-slate-950">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /> Edit</Button>{item.status === "published" && <Button onClick={() => { setShareTarget(item); setShareDays(""); setGeneratedLink(""); }}><Share2 className="h-4 w-4" /> Share</Button>}<Button variant="ghost" onClick={() => deleteRecommendation(item)} className="text-red-600"><Trash2 className="h-4 w-4" /> Delete</Button></div></div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {showCategories && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4" onClick={() => setShowCategories(false)}><div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div><h2 className="text-lg font-black">Manage categories</h2><p className="text-xs text-slate-400">Create, edit, enable, disable, and remove material categories.</p></div><button onClick={() => setShowCategories(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 text-sm font-black text-slate-800">{editingCategory ? "Edit category" : "New category"}</div><div className="space-y-3"><Input autoFocus value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" /><Textarea value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Short category description" className="min-h-24 bg-white" /><div className="flex gap-2"><Button onClick={saveCategory} className="flex-1">{editingCategory ? "Update category" : "Add category"}</Button>{editingCategory && <Button variant="secondary" onClick={() => { setEditingCategory(null); setCategoryName(""); setCategoryDescription(""); }}>Cancel edit</Button>}</div></div></div>
          <div className="mt-5 space-y-2"><div className="text-xs font-black uppercase tracking-wider text-slate-400">Existing categories</div>{categories.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">No categories created yet.</div> : categories.map((category) => <div key={category.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-brand-primary"><BookOpen className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-slate-900">{category.name}</div><div className="truncate text-xs text-slate-400">{category.description || "No description"}</div></div><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${category.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{category.is_active ? "Active" : "Disabled"}</span><button onClick={() => { setEditingCategory(category); setCategoryName(category.name); setCategoryDescription(category.description ?? ""); }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button><button onClick={() => toggleCategory(category)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" title={category.is_active ? "Disable category" : "Enable category"}>{category.is_active ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4" />}</button><button onClick={() => deleteCategory(category)} className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}</div>
        </div>
      </div></div>}

      {showEditor && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" onClick={() => setShowEditor(false)}><div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><div><h2 className="text-lg font-black">{editing ? "Edit recommendation" : "New recommendation"}</h2><p className="text-xs text-slate-400">Build a complete guidance article</p></div><button onClick={() => setShowEditor(false)}><X className="h-5 w-5" /></button></div><div className="space-y-5 p-6">
        <div><label className="mb-1 block text-sm font-semibold">Title *</label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Example: Flooring material recommendation" /></div>
        <div><label className="mb-1 block text-sm font-semibold">Category</label><Select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}><option value="">Uncategorized</option>{categories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>
        <div><label className="mb-1 block text-sm font-semibold">Complete guidance *</label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Explain the recommended material, applications, installation, care, advantages, limitations, and selection guidance. Use blank lines to create readable sections." className="min-h-64" /></div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-semibold">Images, videos and documents</div><p className="mt-1 text-xs text-slate-500">Select any number of files. Large videos use resumable uploads.</p></div><input ref={attachmentInput} type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => void uploadAttachments(event.target.files)} /><Button variant="secondary" onClick={() => attachmentInput.current?.click()} disabled={uploadingAttachments}>{uploadingAttachments ? <Clock3 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploadingAttachments ? `Uploading ${attachmentProgress}%` : "Upload multiple files"}</Button></div>
          {uploadingAttachments && <div className="mt-4"><div className="mb-1 flex justify-between gap-3 text-xs text-slate-500"><span className="truncate">{uploadStatus}</span><span className="font-bold tabular-nums text-brand-primary">{attachmentProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-primary transition-[width]" style={{ width: `${attachmentProgress}%` }} /></div></div>}
          {form.attachments.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{form.attachments.map((attachment, index) => <div key={`${attachment.url}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{attachment.kind === "image" ? <img src={attachment.url} alt={attachment.name} className="h-28 w-full object-cover" /> : attachment.kind === "video" ? <video src={attachment.url} muted preload="metadata" className="h-28 w-full bg-slate-950 object-contain" /> : <div className="grid h-28 place-items-center bg-blue-50 text-blue-600"><FileText className="h-9 w-9" /></div>}<div className="flex items-center gap-2 p-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${attachment.kind === "image" ? "bg-emerald-100 text-emerald-600" : attachment.kind === "video" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{attachment.kind === "image" ? <ImageIcon className="h-4 w-4" /> : attachment.kind === "video" ? <Film className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{attachment.name}</span><button type="button" onClick={() => setForm((current) => ({ ...current, attachments: current.attachments.filter((_, attachmentIndex) => attachmentIndex !== index) }))} className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50" aria-label={`Remove ${attachment.name}`}><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
        </div>
        <div><label className="mb-1 block text-sm font-semibold">Publishing</label><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "draft" | "published" })}><option value="draft">Draft — admin only</option><option value="published">Published — share links can open it</option></Select></div>
        <div className="flex gap-3 border-t border-slate-100 pt-5"><Button onClick={saveRecommendation} disabled={saving} className="flex-1">{saving ? "Saving…" : form.status === "published" ? "Save & publish" : "Save draft"}</Button><Button variant="secondary" onClick={() => setShowEditor(false)}>Cancel</Button></div>
      </div></div></div>}

      {shareTarget && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4" onClick={() => setShareTarget(null)}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><h2 className="text-lg font-black">Share recommendation</h2><p className="mt-1 text-sm text-slate-500">{shareTarget.title}</p></div><button onClick={() => setShareTarget(null)}><X className="h-5 w-5" /></button></div><div className="mt-5"><label className="mb-1 block text-sm font-semibold">Link active for (days)</label><Input type="number" min="1" value={shareDays} onChange={(event) => setShareDays(event.target.value)} placeholder="Leave blank for unlimited" /><p className="mt-1 text-xs text-slate-400">No number means the link remains active until it is revoked.</p></div>{generatedLink ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="text-xs font-bold text-emerald-700">Share link ready</div><div className="mt-2 flex gap-2"><Input readOnly value={generatedLink} className="bg-white" /><Button onClick={() => { void navigator.clipboard.writeText(generatedLink); toast.success("Link copied"); }}><Copy className="h-4 w-4" /> Copy</Button></div></div> : <Button onClick={createShareLink} className="mt-5 w-full"><Link2 className="h-4 w-4" /> Generate share link</Button>}</div></div>}
    </div>
  );
}
