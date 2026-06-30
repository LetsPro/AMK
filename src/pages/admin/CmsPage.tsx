import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit3, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

const cmsTables = ["website_pages", "banners", "services", "gallery", "testimonials"] as const;

export function CmsPage() {
  const [table, setTable] = useState<(typeof cmsTables)[number]>("website_pages");
  const { data = [] } = useTable(table, { orderBy: "created_at" });
  const { create, update, remove } = useTableMutations(table);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const mediaField = "image_url";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const defaults = table === "website_pages" ? { content: form.content ?? "", slug: form.slug, title: form.title, status: form.status || "draft" } :
      table === "services" ? { name: form.title, slug: form.slug, description: form.content ?? "", image_url: form.image_url, status: form.status || "draft" } :
      table === "gallery" ? { title: form.title, image_url: form.image_url } :
      table === "testimonials" ? { name: form.title, quote: form.content ?? "", rating: Number(form.rating || 5), is_published: form.status === "published" } :
      { title: form.title, subtitle: form.content, image_url: form.image_url, cta_label: form.cta_label, cta_url: form.cta_url, is_active: form.status === "published" };
    if (editingId) await update.mutateAsync({ id: editingId, payload: defaults as never });
    else await create.mutateAsync(defaults as never);
    setForm({});
    setEditingId(null);
  }
  function editRecord(record: Record<string, unknown>) {
    setEditingId(String(record.id));
    setForm({
      title: String(record.title ?? record.name ?? ""),
      slug: String(record.slug ?? ""),
      image_url: String(record.image_url ?? ""),
      cover_image_url: String(record.cover_image_url ?? ""),
      status: String(record.status ?? (record.is_active || record.is_published || record.published ? "published" : "draft")),
      content: String(record.content ?? record.description ?? record.subtitle ?? record.quote ?? ""),
      cta_label: String(record.cta_label ?? ""),
      cta_url: String(record.cta_url ?? "")
    });
  }
  function resetForm() {
    setForm({});
    setEditingId(null);
  }
  const columns = [
    ...Object.keys(data[0] ?? { id: "", created_at: "" }).slice(0, 6).map((key) => ({ header: key, accessorKey: key })),
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button className="h-8" variant="ghost" onClick={() => editRecord(row.original as Record<string, unknown>)}><Edit3 className="h-4 w-4" /></Button>
          <Button className="h-8" variant="ghost" onClick={() => remove.mutate((row.original as { id: string }).id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ] as ColumnDef<never>[];
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-black">Website CMS</h1><p className="text-sm text-slate-500">Manage pages, banners, services, projects, gallery, testimonials, SEO metadata, draft publishing, and live preview content.</p></div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="max-w-xs flex-1"><Select value={table} onChange={(e) => { setTable(e.target.value as typeof table); resetForm(); }}>{cmsTables.map((item) => <option key={item}>{item}</option>)}</Select></div>{editingId && <Button type="button" variant="ghost" onClick={resetForm}><X className="h-4 w-4" /> Cancel Edit</Button>}</div>
        {editingId && <div className="mb-4 rounded-md bg-orange-50 p-3 text-sm font-medium text-brand-primary">Editing selected {table} record</div>}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
          <Input required placeholder="Title / Name" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          {table !== "website_pages" && table !== "testimonials" ? <MediaPicker label="Image" value={form[mediaField] ?? ""} onChange={(url) => setForm({ ...form, [mediaField]: url })} /> : <Input placeholder="SEO title or testimonial company" value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />}
          <Select value={form.status ?? "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">draft</option><option value="published">published</option></Select>
          {table === "banners" && <Input placeholder="CTA label" value={form.cta_label ?? ""} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />}
          {table === "banners" && <Input placeholder="CTA URL e.g. #enquiry" value={form.cta_url ?? ""} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />}
          <Textarea className="md:col-span-2" placeholder="Rich text content / description / SEO description" value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Button>{editingId ? "Update" : "Publish / Save Draft"}</Button>
        </form>
      </Card>
      <DataTable data={data as never[]} columns={columns} emptyTitle={`No ${table} records`} />
    </div>
  );
}
