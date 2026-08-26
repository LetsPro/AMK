import { useState } from "react";
import { Edit3, ImageIcon, LayoutTemplate, MessageSquareQuote, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

const cmsTables = ["banners", "testimonials", "gallery", "services"] as const;
type CmsTable = (typeof cmsTables)[number];
type CmsRecord = Record<string, unknown> & { id: string };

const tableDetails: Record<CmsTable, { label: string; description: string; icon: React.ElementType }> = {
  banners: { label: "Hero Slider", description: "Manage hero images, messages, buttons, visibility, and slide order.", icon: LayoutTemplate },
  testimonials: { label: "Testimonials", description: "Publish client reviews, ratings, company details, and profile images.", icon: MessageSquareQuote },
  gallery: { label: "Gallery", description: "Upload, categorize, feature, order, and remove gallery images.", icon: ImageIcon },
  services: { label: "Services", description: "Maintain service copy, images, slugs, and publishing status.", icon: Edit3 }
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
  return value(record, "content");
}

function recordImage(table: CmsTable, record: CmsRecord) {
  return table === "testimonials" ? value(record, "avatar_url") : value(record, "image_url");
}

function recordPublished(table: CmsTable, record: CmsRecord) {
  if (table === "banners") return Boolean(record.is_active);
  if (table === "testimonials") return Boolean(record.is_published);
  if (table === "gallery") return Boolean(record.is_featured);
  return record.status === "published";
}

export function CmsPage() {
  const [table, setTable] = useState<CmsTable>("banners");
  const orderedTable = table === "banners" || table === "testimonials" || table === "gallery";
  const { data = [] } = useTable(table, { orderBy: orderedTable ? "display_order" : "created_at", ascending: orderedTable });
  const { create, update, remove } = useTableMutations(table);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const details = tableDetails[table];
  const EmptyIcon = details.icon;

  function resetForm() {
    setForm({});
    setEditingId(null);
  }

  function changeTable(next: CmsTable) {
    setTable(next);
    resetForm();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (table === "gallery" && !form.image_url) {
      window.alert("Please choose a gallery image before saving.");
      return;
    }
    const displayOrder = Number(form.display_order || data.length + 1);
    const payload = table === "services"
        ? { name: form.title, slug: form.slug, description: form.content ?? "", image_url: form.image_url || null, status: form.status || "draft" }
        : table === "gallery"
          ? { title: form.title, image_url: form.image_url, category: form.category || null, is_featured: form.status === "published", display_order: displayOrder }
          : table === "testimonials"
            ? { name: form.title, company: form.company || null, quote: form.content ?? "", rating: Number(form.rating || 5), avatar_url: form.image_url || null, is_published: form.status === "published", display_order: displayOrder }
            : { title: form.title, subtitle: form.content || null, image_url: form.image_url || null, cta_label: form.cta_label || null, cta_url: form.cta_url || null, is_active: form.status === "published", display_order: displayOrder };

    if (editingId) await update.mutateAsync({ id: editingId, payload: payload as never });
    else await create.mutateAsync(payload as never);
    resetForm();
  }

  function editRecord(record: CmsRecord) {
    setEditingId(record.id);
    setForm({
      title: recordTitle(table, record),
      slug: value(record, "slug"),
      image_url: recordImage(table, record),
      status: table === "gallery"
        ? (record.is_featured ? "published" : "draft")
        : (recordPublished(table, record) ? "published" : "draft"),
      content: recordDescription(table, record),
      category: value(record, "category"),
      company: value(record, "company"),
      rating: value(record, "rating") || "5",
      cta_label: value(record, "cta_label"),
      cta_url: value(record, "cta_url"),
      display_order: value(record, "display_order") || "0"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRecord(record: CmsRecord) {
    if (window.confirm(`Delete “${recordTitle(table, record)}”? This cannot be undone.`)) remove.mutate(record.id);
  }

  const needsImage = table === "banners" || table === "testimonials" || table === "gallery" || table === "services";
  const hasOrder = table === "banners" || table === "testimonials" || table === "gallery";
  const statusLabel = table === "banners" ? "Slide visibility" : table === "gallery" ? "Featured status" : "Publishing status";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Website CMS</h1>
        <p className="text-sm text-slate-500">Manage the live website’s slider, testimonials, gallery, and services from one place.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cmsTables.map((item) => {
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
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black">{editingId ? `Edit ${details.label}` : `Add ${details.label} Item`}</h2>
            <p className="mt-1 text-sm text-slate-500">{details.description}</p>
          </div>
          {editingId && <Button type="button" variant="ghost" onClick={resetForm}><X className="h-4 w-4" /> Cancel Edit</Button>}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label>
            <span className="mb-1 block text-sm font-medium">{table === "testimonials" ? "Client name" : table === "services" ? "Service name" : "Title"}</span>
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
              <span className="mb-1 block text-sm font-medium">Category</span>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Residential, Commercial, Interior…" />
            </label>
          )}

          {needsImage && (
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">{table === "testimonials" ? "Client photo (optional)" : "Image"}</span>
              <MediaPicker label={table === "testimonials" ? "Client photo" : `${details.label} image`} value={form.image_url ?? ""} onChange={(image_url) => setForm({ ...form, image_url })} />
            </label>
          )}

          {table === "banners" && (
            <>
              <label>
                <span className="mb-1 block text-sm font-medium">Button label</span>
                <Input value={form.cta_label ?? ""} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="Start a Project" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Button destination</span>
                <Input value={form.cta_url ?? ""} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="/contact or #enquiry" />
              </label>
            </>
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
            <Select value={form.status ?? "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">{table === "banners" ? "Hidden" : table === "gallery" ? "Standard" : "Draft / hidden"}</option>
              <option value="published">{table === "banners" ? "Visible" : table === "gallery" ? "Featured" : "Published"}</option>
            </Select>
          </label>

          {table !== "gallery" && (
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">{table === "banners" ? "Subtitle / supporting content" : table === "testimonials" ? "Testimonial" : "Description"}</span>
              <Textarea required value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </label>
          )}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button disabled={create.isPending || update.isPending}>
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Save Changes" : "Add Item"}
            </Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Existing {details.label}</h2>
            <p className="text-sm text-slate-500">{data.length} item{data.length === 1 ? "" : "s"}</p>
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
                      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7 text-slate-300" />}
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
              <p className="mt-1 text-sm text-slate-500">Use the form above to add the first item.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
