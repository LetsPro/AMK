import { useEffect, useState } from "react";
import { Clock3, Edit3, FolderCog, ImageIcon, LayoutTemplate, MessageSquareQuote, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

const cmsTables = ["banners", "testimonials", "gallery", "services", "website_pages"] as const;
type CmsTable = (typeof cmsTables)[number];
type CmsRecord = Record<string, unknown> & { id: string };

function testimonialSeconds(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 3;
  const seconds = Number((value as Record<string, unknown>).seconds);
  return Number.isFinite(seconds) ? Math.min(30, Math.max(2, Math.round(seconds))) : 3;
}

const tableDetails: Record<CmsTable, { label: string; description: string; icon: React.ElementType }> = {
  banners: { label: "Hero Slider", description: "Manage hero images, messages, visibility, and slide order. Standard website actions appear automatically on every slide.", icon: LayoutTemplate },
  testimonials: { label: "Testimonials", description: "Publish client reviews, ratings, company details, profile images, and videos.", icon: MessageSquareQuote },
  gallery: { label: "Gallery", description: "Upload, categorize, feature, order, and remove gallery images or videos.", icon: ImageIcon },
  services: { label: "Services", description: "Maintain service copy, images, slugs, and publishing status.", icon: Edit3 },
  website_pages: { label: "About Us", description: "Manage the founder photo and supporting About introduction shown on the website.", icon: ImageIcon }
};

function value(record: CmsRecord, ...keys: string[]) {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null) return String(record[key]);
  return "";
}

function recordTitle(table: CmsTable, record: CmsRecord) {
  return table === "testimonials" ? value(record, "name") : table === "services" ? value(record, "name") : value(record, "title");
}

function recordDescription(table: CmsTable, record: CmsRecord) {
  if (table === "banners") return value(record, "subtitle");
  if (table === "testimonials") return value(record, "quote");
  if (table === "gallery") return value(record, "category") || "Uncategorized";
  if (table === "services") return value(record, "description");
  if (table === "website_pages") return value(record, "content");
  return value(record, "content");
}

function recordImage(table: CmsTable, record: CmsRecord) {
  if (table === "testimonials") return value(record, "avatar_url");
  return value(record, "image_url");
}

function recordPublished(table: CmsTable, record: CmsRecord) {
  if (table === "banners") return Boolean(record.is_active);
  if (table === "testimonials") return Boolean(record.is_published);
  if (table === "gallery") return Boolean(record.is_featured);
  if (table === "website_pages") return record.status === "published";
  return record.status === "published";
}

export function CmsPage({ galleryOnly = false }: { galleryOnly?: boolean }) {
  const [table, setTable] = useState<CmsTable>(galleryOnly ? "gallery" : "banners");
  const orderedTable = table === "banners" || table === "testimonials" || table === "gallery";
  const { data = [], refetch } = useTable(table, { orderBy: orderedTable ? "display_order" : "created_at", ascending: orderedTable, ...(table === "website_pages" ? { eq: { slug: "about" } } : {}) });
  const { create, update, remove } = useTableMutations(table);
  const { data: galleryCategories = [], refetch: refetchGalleryCategories } = useTable("gallery_categories", { orderBy: "display_order", ascending: true });
  const galleryCategoryMutations = useTableMutations("gallery_categories");
  const { data: testimonialSettings = [] } = useTable("app_settings", { eq: { key: "testimonial_carousel" }, limit: 1 });
  const testimonialSettingMutations = useTableMutations("app_settings");
  const [form, setForm] = useState<Record<string, string>>({});
  const [testimonialInterval, setTestimonialInterval] = useState("3");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", description: "", display_order: "" });
  const details = tableDetails[table];
  const EmptyIcon = details.icon;
  const visibleTables = galleryOnly ? (["gallery"] as CmsTable[]) : cmsTables.filter((item) => item !== "gallery");

  useEffect(() => {
    setTestimonialInterval(String(testimonialSeconds(testimonialSettings[0]?.value)));
  }, [testimonialSettings]);

  useEffect(() => {
    if (!editorOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && closeEditor();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editorOpen]);

  function resetForm() {
    setForm({});
    setEditingId(null);
  }

  function openNewEditor() {
    resetForm();
    setEditorOpen(true);
  }

  function closeEditor() {
    resetForm();
    setEditorOpen(false);
  }

  function changeTable(next: CmsTable) {
    setTable(next);
    resetForm();
    setEditorOpen(false);
  }

  function categorySlug(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `category-${Date.now()}`;
  }

  async function saveGalleryCategory(event: React.FormEvent) {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) return;
    const payload = {
      name,
      slug: categorySlug(name),
      description: categoryForm.description.trim() || null,
      display_order: Number(categoryForm.display_order || galleryCategories.length + 1),
      is_active: true,
    };
    if (categoryForm.id) await galleryCategoryMutations.update.mutateAsync({ id: categoryForm.id, payload });
    else await galleryCategoryMutations.create.mutateAsync(payload);
    await refetchGalleryCategories();
    setCategoryForm({ id: "", name: "", description: "", display_order: "" });
  }

  async function deleteGalleryCategory(category: CmsRecord) {
    if (!window.confirm(`Delete category “${value(category, "name")}”? Gallery items will remain uncategorized.`)) return;
    await galleryCategoryMutations.remove.mutateAsync(category.id);
    await refetchGalleryCategories();
    if (form.category_id === category.id) setForm({ ...form, category_id: "" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (table === "gallery" && !form.image_url) {
      window.alert(`Please choose a gallery ${form.media_type === "video" ? "video" : "image"} before saving.`);
      return;
    }
    const displayOrder = Number(form.display_order || data.length + 1);
    const payload = table === "website_pages"
      ? {
          slug: "about",
          title: form.title || "About Us",
          content: form.content ?? "",
          image_url: form.image_url || null,
          founder_name: form.founder_name?.trim() || null,
          founder_roles: form.founder_roles?.trim() || null,
          founder_bio: form.founder_bio?.trim() || null,
          founder_statement: form.founder_statement?.trim() || null,
          status: form.status || "published",
        }
      : table === "services"
        ? { name: form.title, slug: form.slug, description: form.content ?? "", image_url: form.image_url || null, status: form.status || "draft" }
        : table === "gallery"
          ? (() => {
              const selectedCategory = galleryCategories.find((category) => category.id === form.category_id);
              return { title: form.title, image_url: form.image_url, category_id: form.category_id || null, category: selectedCategory?.name || null, media_type: form.media_type || "image", is_featured: form.status === "published", display_order: displayOrder };
            })()
          : table === "testimonials"
            ? { name: form.title, company: form.company || null, quote: form.content ?? "", rating: Number(form.rating || 5), avatar_url: form.image_url || null, video_url: form.video_url || null, is_published: form.status === "published", display_order: displayOrder }
            : { title: form.title.trim(), subtitle: form.content?.trim() || null, image_url: form.image_url || null, is_active: form.status === "published", display_order: displayOrder };

    if (editingId) await update.mutateAsync({ id: editingId, payload: payload as never });
    else await create.mutateAsync(payload as never);
    await refetch();
    closeEditor();
  }

  function editRecord(record: CmsRecord) {
    setEditingId(record.id);
    setForm({
      title: recordTitle(table, record),
      slug: value(record, "slug"),
      image_url: recordImage(table, record),
      video_url: value(record, "video_url"),
      status: table === "gallery"
        ? (record.is_featured ? "published" : "draft")
        : (recordPublished(table, record) ? "published" : "draft"),
      content: recordDescription(table, record),
      category: value(record, "category"),
      category_id: value(record, "category_id"),
      media_type: value(record, "media_type") || "image",
      company: value(record, "company"),
      rating: value(record, "rating") || "5",
      display_order: value(record, "display_order") || "0",
      founder_name: value(record, "founder_name"),
      founder_roles: value(record, "founder_roles"),
      founder_bio: value(record, "founder_bio"),
      founder_statement: value(record, "founder_statement"),
    });
    setEditorOpen(true);
  }

  function deleteRecord(record: CmsRecord) {
    if (window.confirm(`Delete “${recordTitle(table, record)}”? This cannot be undone.`)) remove.mutate(record.id);
  }

  async function saveTestimonialInterval(event: React.FormEvent) {
    event.preventDefault();
    const seconds = Math.min(30, Math.max(2, Number(testimonialInterval) || 3));
    setTestimonialInterval(String(seconds));
    const row = testimonialSettings[0];
    if (row) await testimonialSettingMutations.update.mutateAsync({ id: row.id, payload: { value: { seconds } } });
    else await testimonialSettingMutations.create.mutateAsync({ key: "testimonial_carousel", value: { seconds } });
  }

  const needsImage = table === "banners" || table === "testimonials" || table === "gallery" || table === "services" || table === "website_pages";
  const hasOrder = table === "banners" || table === "testimonials" || table === "gallery";
  const statusLabel = table === "banners" ? "Slide visibility" : table === "gallery" ? "Featured status" : "Publishing status";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">{galleryOnly ? "Gallery Management" : "Website CMS"}</h1>
        <p className="text-sm text-slate-500">{galleryOnly ? "Manage public gallery categories, images, videos, ordering, and featured media." : "Manage the live website’s slider, testimonials, services, and About/Founder content from one place."}</p>
      </div>

      {!galleryOnly && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleTables.map((item) => {
          const itemDetails = tableDetails[item];
          const Icon = itemDetails.icon;
          return (
            <button
              key={item}
              type="button"
              onClick={() => changeTable(item)}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${table === item ? "border-brand-primary bg-orange-50 text-brand-primary shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-bold">{itemDetails.label}</span>
            </button>
          );
        })}
      </div>}

      {editorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm md:p-6" onMouseDown={(event) => event.target === event.currentTarget && closeEditor()}>
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-white p-5 shadow-2xl md:p-6" role="dialog" aria-modal="true" aria-labelledby="cms-editor-title">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">{galleryOnly ? "Gallery Management" : "Website CMS"}</div>
            <h2 id="cms-editor-title" className="mt-1 text-xl font-black">{editingId ? `Edit ${details.label}` : `Add ${details.label} Item`}</h2>
            <p className="mt-1 text-sm text-slate-500">{details.description}</p>
          </div>
          <button type="button" onClick={closeEditor} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close CMS editor"><X className="h-5 w-5" /></button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label>
            <span className="mb-1 block text-sm font-medium">{table === "testimonials" ? "Client name" : table === "services" ? "Service name" : table === "website_pages" ? "Section title" : "Title"}</span>
            <Input required value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>

          {table === "services" && (
            <label>
              <span className="mb-1 block text-sm font-medium">URL slug</span>
              <Input required value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="example-page" />
            </label>
          )}

          {table === "testimonials" && (
            <label>
              <span className="mb-1 block text-sm font-medium">Company / project</span>
              <Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </label>
          )}

          {table === "gallery" && (
            <label>
              <span className="mb-1 block text-sm font-medium">Media type</span>
              <Select value={form.media_type ?? "image"} onChange={(e) => setForm({ ...form, media_type: e.target.value, image_url: "" })}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </Select>
            </label>
          )}

          {table === "gallery" && (
            <label>
              <span className="mb-1 block text-sm font-medium">Category</span>
              <Select required value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category</option>
                {galleryCategories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </Select>
            </label>
          )}

          {needsImage && (
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">{table === "testimonials" ? "Client photo (optional)" : table === "website_pages" ? "Founder photo (optional)" : table === "gallery" && form.media_type === "video" ? "Gallery video" : "Image"}</span>
              <MediaPicker mediaType={table === "gallery" && form.media_type === "video" ? "video" : "image"} label={table === "testimonials" ? "Client photo" : table === "website_pages" ? "Founder photo" : table === "gallery" && form.media_type === "video" ? "Gallery video" : `${details.label} image`} value={form.image_url ?? ""} onChange={(image_url) => setForm({ ...form, image_url })} />
            </label>
          )}

          {table === "testimonials" && (
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Testimonial video (optional)</span>
              <MediaPicker mediaType="video" label="Testimonial video" value={form.video_url ?? ""} onChange={(video_url) => setForm({ ...form, video_url })} />
            </label>
          )}

          {table === "banners" && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-slate-600 md:col-span-2">
              Every hero slide automatically shows <strong>View Projects</strong>, <strong>Login</strong>, and <strong>Get Started</strong> in that order.
            </div>
          )}

          {table === "testimonials" && (
            <label>
              <span className="mb-1 block text-sm font-medium">Rating</span>
              <Select value={form.rating ?? "5"} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
              </Select>
            </label>
          )}

          {hasOrder && (
            <label>
              <span className="mb-1 block text-sm font-medium">Display order</span>
              <Input type="number" min="0" value={form.display_order ?? String(data.length + 1)} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </label>
          )}

          <label>
            <span className="mb-1 block text-sm font-medium">{statusLabel}</span>
            <Select value={form.status ?? (table === "website_pages" ? "published" : "draft")} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">{table === "banners" ? "Hidden" : table === "gallery" ? "Standard" : "Draft / hidden"}</option>
              <option value="published">{table === "banners" ? "Visible" : table === "gallery" ? "Featured" : "Published"}</option>
            </Select>
          </label>

          {table !== "gallery" && (
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">{table === "banners" ? "Subtitle / supporting content" : table === "testimonials" ? "Testimonial" : table === "website_pages" ? "About introduction" : "Description"}</span>
              <Textarea required value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </label>
          )}

          {table === "website_pages" && (
            <>
              <label>
                <span className="mb-1 block text-sm font-medium">Founder name</span>
                <Input required value={form.founder_name ?? ""} onChange={(e) => setForm({ ...form, founder_name: e.target.value })} placeholder="Ar. Andra Manoj Kumar" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Professional titles / roles</span>
                <Input required value={form.founder_roles ?? ""} onChange={(e) => setForm({ ...form, founder_roles: e.target.value })} placeholder="Architect | Computational Designer | BIM Specialist" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Founder biography</span>
                <Textarea required value={form.founder_bio ?? ""} onChange={(e) => setForm({ ...form, founder_bio: e.target.value })} className="min-h-28" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Founder statement / supporting content</span>
                <Textarea required value={form.founder_statement ?? ""} onChange={(e) => setForm({ ...form, founder_statement: e.target.value })} className="min-h-28" />
              </label>
            </>
          )}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button disabled={create.isPending || update.isPending}>
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Save Changes" : "Add Item"}
            </Button>
            <Button type="button" variant="secondary" onClick={closeEditor}>Cancel</Button>
          </div>
        </form>
          </Card>
        </div>
      )}

      {table === "testimonials" && (
        <Card className="bg-white">
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={saveTestimonialInterval}>
            <label className="w-full max-w-xs">
              <span className="mb-1 flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-brand-primary" /> Auto-scroll time</span>
              <Input type="number" min="2" max="30" step="1" value={testimonialInterval} onChange={(event) => setTestimonialInterval(event.target.value)} />
              <span className="mt-1 block text-xs text-slate-500">Seconds before the next testimonial appears (2–30).</span>
            </label>
            <Button disabled={testimonialSettingMutations.create.isPending || testimonialSettingMutations.update.isPending}><Save className="h-4 w-4" /> Save timing</Button>
          </form>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Existing {details.label}</h2>
            <p className="text-sm text-slate-500">{data.length} item{data.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
          {table === "gallery" && <Button type="button" variant="secondary" onClick={() => setCategoryManagerOpen(true)}><FolderCog className="h-4 w-4" /> Manage categories</Button>}
          <Button type="button" onClick={() => table === "website_pages" && data[0] ? editRecord(data[0] as CmsRecord) : openNewEditor()}>
            {table === "website_pages" && data[0] ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {table === "website_pages" && data[0] ? "Edit About Us" : `Add ${details.label}`}
          </Button>
          </div>
        </div>

        {data.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {(data as CmsRecord[]).map((record) => {
              const image = recordImage(table, record);
              const published = recordPublished(table, record);
              return (
                <Card key={record.id} className="flex gap-4 bg-white p-4">
                  {needsImage && (
                    <div className="grid h-24 w-28 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100">
                      {image ? (table === "gallery" && record.media_type === "video" ? <video src={image} muted preload="metadata" className="h-full w-full object-cover" /> : <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />) : <ImageIcon className="h-7 w-7 text-slate-300" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-950">{recordTitle(table, record)}</div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{recordDescription(table, record) || "No supporting content"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {table === "gallery" ? (published ? "Featured" : "Standard") : (published ? "Live" : "Hidden")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {hasOrder ? <span className="text-xs font-semibold text-slate-400">Order {value(record, "display_order") || "0"}</span> : <span />}
                      <div className="flex gap-1">
                        <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => editRecord(record)}><Edit3 className="h-4 w-4" /> Edit</Button>
                        <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => deleteRecord(record)}><Trash2 className="h-4 w-4" /> Delete</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="grid min-h-48 place-items-center border border-dashed border-slate-300 bg-white text-center">
            <div>
              <EmptyIcon className="mx-auto h-8 w-8 text-brand-primary" />
              <p className="mt-3 font-bold">No {details.label.toLowerCase()} items yet</p>
              <p className="mt-1 text-sm text-slate-500">Use the Add {details.label} button to create the first item.</p>
            </div>
          </Card>
        )}
      </div>

      {categoryManagerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setCategoryManagerOpen(false)}>
          <Card className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="gallery-categories-title">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div><div className="text-xs font-bold uppercase tracking-wide text-brand-primary">Gallery</div><h2 id="gallery-categories-title" className="mt-1 text-xl font-black">Manage categories</h2><p className="mt-1 text-sm text-slate-500">Create the categories available during image or video upload.</p></div>
              <button type="button" onClick={() => setCategoryManagerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100" aria-label="Close category manager"><X className="h-5 w-5" /></button>
            </div>
            <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_120px]" onSubmit={saveGalleryCategory}>
              <Input required placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
              <Input type="number" min="0" placeholder="Order" value={categoryForm.display_order} onChange={(event) => setCategoryForm({ ...categoryForm, display_order: event.target.value })} />
              <Textarea className="sm:col-span-2" placeholder="Short category description (optional)" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
              <div className="flex gap-2 sm:col-span-2"><Button disabled={galleryCategoryMutations.create.isPending || galleryCategoryMutations.update.isPending}>{categoryForm.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{categoryForm.id ? "Save category" : "Add category"}</Button>{categoryForm.id && <Button type="button" variant="secondary" onClick={() => setCategoryForm({ id: "", name: "", description: "", display_order: "" })}>Cancel edit</Button>}</div>
            </form>
            <div className="mt-5 space-y-2">
              {galleryCategories.length ? galleryCategories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div className="min-w-0"><div className="font-bold">{category.name}</div><div className="truncate text-sm text-slate-500">{category.description || "No description"} · Order {category.display_order}</div></div><div className="flex gap-1"><Button type="button" variant="ghost" className="h-8 px-3" onClick={() => setCategoryForm({ id: category.id, name: category.name, description: category.description || "", display_order: String(category.display_order) })}><Edit3 className="h-4 w-4" /> Edit</Button><Button type="button" variant="ghost" className="h-8 px-3" onClick={() => deleteGalleryCategory(category as CmsRecord)}><Trash2 className="h-4 w-4" /> Delete</Button></div></div>) : <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No gallery categories yet.</div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function GalleryManagementPage() {
  return <CmsPage galleryOnly />;
}
