import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";

const cmsTables = ["website_pages", "banners", "services", "projects", "gallery", "testimonials"] as const;

export function CmsPage() {
  const [table, setTable] = useState<(typeof cmsTables)[number]>("website_pages");
  const { data = [] } = useTable(table, { orderBy: "created_at" });
  const { create } = useTableMutations(table);
  const [form, setForm] = useState<Record<string, string>>({});
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const defaults = table === "website_pages" ? { content: form.content ?? "", slug: form.slug, title: form.title, status: form.status || "draft" } :
      table === "services" ? { name: form.title, slug: form.slug, description: form.content ?? "", status: form.status || "draft" } :
      table === "projects" ? { name: form.title, slug: form.slug, description: form.content ?? "", status: "Planning", published: form.status === "published" } :
      table === "gallery" ? { title: form.title, image_url: form.image_url } :
      table === "testimonials" ? { name: form.title, quote: form.content ?? "", rating: Number(form.rating || 5), is_published: form.status === "published" } :
      { title: form.title, subtitle: form.content, image_url: form.image_url, is_active: form.status === "published" };
    await create.mutateAsync(defaults as never);
    setForm({});
  }
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-black">Website CMS</h1><p className="text-sm text-slate-500">Manage pages, banners, services, projects, gallery, testimonials, SEO metadata, draft publishing, and live preview content.</p></div>
      <Card>
        <div className="mb-4 max-w-xs"><Select value={table} onChange={(e) => setTable(e.target.value as typeof table)}>{cmsTables.map((item) => <option key={item}>{item}</option>)}</Select></div>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
          <Input required placeholder="Title / Name" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="Image URL" value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <Select value={form.status ?? "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">draft</option><option value="published">published</option></Select>
          <Textarea className="md:col-span-2" placeholder="Rich text content / description / SEO description" value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Button>Publish / Save Draft</Button>
        </form>
      </Card>
      <DataTable data={data as never[]} columns={Object.keys(data[0] ?? { id: "", created_at: "" }).slice(0, 6).map((key) => ({ header: key, accessorKey: key })) as never[]} emptyTitle={`No ${table} records`} />
    </div>
  );
}
