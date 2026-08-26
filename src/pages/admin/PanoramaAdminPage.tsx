import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, FolderPlus, ImageIcon, Plus, Save, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";
import type { TableRow } from "@/types/database";
import { useToast } from "@/contexts/ToastContext";

type PanoramaCategory = TableRow<"panorama_categories">;
type Panorama = TableRow<"panoramas">;
type Client = TableRow<"clients">;
type PanoramaAssignment = TableRow<"client_panorama_assignments">;

const emptyCategory = { name: "", slug: "", description: "", display_order: "", is_active: "true" };
const emptyPanorama = { category_id: "", title: "", description: "", image_url: "", status: "draft", display_order: "" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function PanoramaAdminPage() {
  const { data: categoryRows = [] } = useTable("panorama_categories", { orderBy: "display_order", ascending: true });
  const { data: panoramaRows = [] } = useTable("panoramas", { orderBy: "display_order", ascending: true });
  const { data: clientRows = [] } = useTable("clients", { orderBy: "name", ascending: true });
  const { data: assignmentRows = [] } = useTable("client_panorama_assignments", { orderBy: "created_at", ascending: true });
  const categoryMutations = useTableMutations("panorama_categories");
  const panoramaMutations = useTableMutations("panoramas");
  const assignmentMutations = useTableMutations("client_panorama_assignments", { toast: false });
  const toast = useToast();
  const categories = categoryRows as PanoramaCategory[];
  const panoramas = panoramaRows as Panorama[];
  const clients = clientRows as Client[];
  const assignments = assignmentRows as PanoramaAssignment[];
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [panoramaForm, setPanoramaForm] = useState(emptyPanorama);
  const [panoramaEditingId, setPanoramaEditingId] = useState<string | null>(null);
  const [panoramaModalOpen, setPanoramaModalOpen] = useState(false);
  const [assignmentPanorama, setAssignmentPanorama] = useState<Panorama | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  useEffect(() => {
    if (!categoryModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && closeCategoryModal();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [categoryModalOpen]);

  useEffect(() => {
    if (!assignmentPanorama) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setAssignmentPanorama(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [assignmentPanorama]);

  useEffect(() => {
    if (!panoramaModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && closePanoramaModal();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [panoramaModalOpen]);

  function resetCategory() {
    setCategoryForm(emptyCategory);
    setCategoryEditingId(null);
  }

  function openCategoryModal() {
    resetCategory();
    setCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    resetCategory();
    setCategoryModalOpen(false);
  }

  function resetPanorama() {
    setPanoramaForm(emptyPanorama);
    setPanoramaEditingId(null);
  }

  function openPanoramaModal() {
    resetPanorama();
    setPanoramaModalOpen(true);
  }

  function closePanoramaModal() {
    resetPanorama();
    setPanoramaModalOpen(false);
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: categoryForm.name.trim(),
      slug: slugify(categoryForm.slug || categoryForm.name),
      description: categoryForm.description.trim() || null,
      display_order: Number(categoryForm.display_order || categories.length + 1),
      is_active: categoryForm.is_active === "true"
    };
    if (categoryEditingId) await categoryMutations.update.mutateAsync({ id: categoryEditingId, payload });
    else await categoryMutations.create.mutateAsync(payload);
    resetCategory();
  }

  async function savePanorama(event: React.FormEvent) {
    event.preventDefault();
    if (!panoramaForm.image_url) {
      window.alert("Please upload or select a panoramic image before saving.");
      return;
    }
    const payload = {
      category_id: panoramaForm.category_id,
      title: panoramaForm.title.trim(),
      description: panoramaForm.description.trim() || null,
      image_url: panoramaForm.image_url,
      status: panoramaForm.status as "draft" | "published",
      display_order: Number(panoramaForm.display_order || panoramas.length + 1)
    };
    if (panoramaEditingId) await panoramaMutations.update.mutateAsync({ id: panoramaEditingId, payload });
    else await panoramaMutations.create.mutateAsync(payload);
    closePanoramaModal();
  }

  function editCategory(category: PanoramaCategory) {
    setCategoryModalOpen(true);
    setCategoryEditingId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      display_order: String(category.display_order),
      is_active: String(category.is_active)
    });
  }

  function editPanorama(panorama: Panorama) {
    setPanoramaModalOpen(true);
    setPanoramaEditingId(panorama.id);
    setPanoramaForm({
      category_id: panorama.category_id,
      title: panorama.title,
      description: panorama.description ?? "",
      image_url: panorama.image_url,
      status: panorama.status,
      display_order: String(panorama.display_order)
    });
  }

  function deleteCategory(category: PanoramaCategory) {
    const count = panoramas.filter((panorama) => panorama.category_id === category.id).length;
    const detail = count ? ` This will also delete ${count} panorama${count === 1 ? "" : "s"} in this category.` : "";
    if (window.confirm(`Delete category “${category.name}”?${detail}`)) categoryMutations.remove.mutate(category.id);
  }

  function deletePanorama(panorama: Panorama) {
    if (window.confirm(`Delete 360 interior “${panorama.title}”?`)) panoramaMutations.remove.mutate(panorama.id);
  }

  function openAssignments(panorama: Panorama) {
    setSelectedClientIds(assignments.filter((assignment) => assignment.panorama_id === panorama.id).map((assignment) => assignment.client_id));
    setAssignmentPanorama(panorama);
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds((current) => current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId]);
  }

  async function saveAssignments() {
    if (!assignmentPanorama) return;
    setSavingAssignments(true);
    try {
      const existing = assignments.filter((assignment) => assignment.panorama_id === assignmentPanorama.id);
      const selected = new Set(selectedClientIds);
      const existingClientIds = new Set(existing.map((assignment) => assignment.client_id));
      const toCreate = selectedClientIds.filter((clientId) => !existingClientIds.has(clientId));
      const toRemove = existing.filter((assignment) => !selected.has(assignment.client_id));
      await Promise.all([
        ...toCreate.map((clientId) => assignmentMutations.create.mutateAsync({ client_id: clientId, panorama_id: assignmentPanorama.id })),
        ...toRemove.map((assignment) => assignmentMutations.remove.mutateAsync(assignment.id))
      ]);
      toast.success("Assignments updated", `${assignmentPanorama.title} is assigned to ${selectedClientIds.length} client${selectedClientIds.length === 1 ? "" : "s"}.`);
      setAssignmentPanorama(null);
    } catch (error) {
      toast.error("Assignment failed", error instanceof Error ? error.message : "Could not update client assignments.");
    } finally {
      setSavingAssignments(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-primary"><Eye className="h-4 w-4" /> Immersive Content</div>
          <h1 className="mt-2 text-3xl font-black">360 Interiors</h1>
          <p className="mt-1 text-sm text-slate-500">Create categories and publish equirectangular panoramic interiors to the public 360 viewer.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={openCategoryModal}><FolderPlus className="h-4 w-4" /> Manage Categories ({categories.length})</Button>
          <Button type="button" onClick={openPanoramaModal} disabled={!categories.length}><Plus className="h-4 w-4" /> Add 360 Interior</Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black">Published and Draft Interiors</h2>
        <p className="mt-1 text-sm text-slate-500">{panoramas.length} panorama{panoramas.length === 1 ? "" : "s"} available.</p>
        {panoramas.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {panoramas.map((panorama) => (
              <Card key={panorama.id} className="flex gap-4 bg-white p-4">
                <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  <img src={panorama.image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 grid place-items-center bg-slate-950/20"><Eye className="h-7 w-7 text-white" /></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-950">{panorama.title}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">{categoryById.get(panorama.category_id)?.name ?? "Unknown category"}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${panorama.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{panorama.status === "published" ? "Live" : "Draft"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{panorama.description || "No description"}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">Order {panorama.display_order}</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => openAssignments(panorama)}><Users className="h-4 w-4" /> Assign ({assignments.filter((assignment) => assignment.panorama_id === panorama.id).length})</Button>
                      <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => editPanorama(panorama)}><Edit3 className="h-4 w-4" /> Edit</Button>
                      <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => deletePanorama(panorama)}><Trash2 className="h-4 w-4" /> Delete</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4 grid min-h-48 place-items-center border border-dashed border-slate-300 bg-white text-center">
            <div><ImageIcon className="mx-auto h-8 w-8 text-brand-primary" /><p className="mt-3 font-bold">No 360 interiors yet</p><p className="mt-1 text-sm text-slate-500">Create a category, then upload the first panoramic image.</p></div>
          </Card>
        )}
      </div>

      {panoramaModalOpen && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm md:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && closePanoramaModal()}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="panorama-editor-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">360 Interiors</div>
                <h2 id="panorama-editor-title" className="mt-1 text-2xl font-black text-slate-950">{panoramaEditingId ? "Edit 360 Interior" : "Add 360 Interior"}</h2>
                <p className="mt-1 text-sm text-slate-500">Upload a 2:1 equirectangular image for the best full-sphere viewing result.</p>
              </div>
              <button type="button" onClick={closePanoramaModal} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close 360 interior editor"><X className="h-5 w-5" /></button>
            </div>

            <form className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 md:grid-cols-2 md:p-6" onSubmit={savePanorama}>
              <label>
                <span className="mb-1 block text-sm font-medium">Title</span>
                <Input autoFocus required value={panoramaForm.title} onChange={(event) => setPanoramaForm({ ...panoramaForm, title: event.target.value })} placeholder="Modern Villa Living Room" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Category</span>
                <Select required value={panoramaForm.category_id} onChange={(event) => setPanoramaForm({ ...panoramaForm, category_id: event.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Small description</span>
                <Textarea value={panoramaForm.description} onChange={(event) => setPanoramaForm({ ...panoramaForm, description: event.target.value })} placeholder="Describe the space, materials, or design idea." />
              </label>
              <div className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Panoramic image</span>
                <MediaPicker label="Panoramic image" value={panoramaForm.image_url} onChange={(image_url) => setPanoramaForm({ ...panoramaForm, image_url })} />
                <span className="mt-2 block text-xs text-slate-500">JPEG or WebP recommended. Maximum upload size is 50 MB after the included database migration is applied.</span>
              </div>
              <label>
                <span className="mb-1 block text-sm font-medium">Display order</span>
                <Input type="number" min="0" value={panoramaForm.display_order} onChange={(event) => setPanoramaForm({ ...panoramaForm, display_order: event.target.value })} placeholder={String(panoramas.length + 1)} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Publishing status</span>
                <Select value={panoramaForm.status} onChange={(event) => setPanoramaForm({ ...panoramaForm, status: event.target.value })}>
                  <option value="draft">Draft / hidden</option>
                  <option value="published">Published</option>
                </Select>
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 md:col-span-2">
                <Button type="button" variant="secondary" onClick={closePanoramaModal}>Cancel</Button>
                <Button disabled={!categories.length || panoramaMutations.create.isPending || panoramaMutations.update.isPending}>
                  {panoramaEditingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {panoramaEditingId ? "Save Changes" : "Add 360 Interior"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignmentPanorama && (
        <div
          className="fixed inset-0 z-[1002] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm md:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && setAssignmentPanorama(null)}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Client Access</div>
                <h2 id="assignment-modal-title" className="mt-1 text-2xl font-black text-slate-950">Assign 360 Interior</h2>
                <p className="mt-1 text-sm text-slate-500">Choose the clients who can view “{assignmentPanorama.title}” in their portal.</p>
              </div>
              <button type="button" onClick={() => setAssignmentPanorama(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close assignment manager"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 md:px-6">
              <span className="text-sm font-semibold text-slate-600">{selectedClientIds.length} of {clients.length} clients selected</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedClientIds(clients.map((client) => client.id))} className="text-sm font-bold text-brand-primary hover:underline">Select all</button>
                <span className="text-slate-300">·</span>
                <button type="button" onClick={() => setSelectedClientIds([])} className="text-sm font-bold text-slate-500 hover:text-slate-900">Clear</button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
              {clients.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {clients.map((client) => {
                    const selected = selectedClientIds.includes(client.id);
                    return (
                      <label key={client.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${selected ? "border-brand-primary bg-orange-50 ring-2 ring-orange-100" : "border-slate-200 bg-white hover:border-orange-200"}`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleClient(client.id)} className="mt-0.5 h-4 w-4 accent-orange-600" />
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-950">{client.name}</span>
                          <span className="mt-1 block truncate text-xs text-slate-500">{client.email || client.mobile || "No contact details"}</span>
                          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${client.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{client.status}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-slate-300 text-center">
                  <div><Users className="mx-auto h-8 w-8 text-brand-primary" /><p className="mt-3 font-bold">No clients available</p><p className="mt-1 text-sm text-slate-500">Create a client account before assigning 360 interiors.</p></div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
              <Button type="button" variant="secondary" onClick={() => setAssignmentPanorama(null)}>Cancel</Button>
              <Button type="button" onClick={saveAssignments} disabled={savingAssignments}><Users className="h-4 w-4" /> Save Assignments</Button>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm md:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && closeCategoryModal()}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="category-modal-title" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">360 Interiors</div>
                <h2 id="category-modal-title" className="mt-1 text-2xl font-black text-slate-950">Manage Categories</h2>
                <p className="mt-1 text-sm text-slate-500">Add, edit, order, hide, or delete the categories shown on the public page.</p>
              </div>
              <button type="button" onClick={closeCategoryModal} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close category manager"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.85fr_1.15fr]">
              <div className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{categoryEditingId ? "Edit Category" : "Add Category"}</h3>
                    <p className="text-xs text-slate-500">Category names and descriptions appear as public filters.</p>
                  </div>
                  {categoryEditingId && <Button type="button" className="h-8 px-3" variant="ghost" onClick={resetCategory}><Plus className="h-4 w-4" /> New</Button>}
                </div>

                <form className="space-y-4" onSubmit={saveCategory}>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Category name</span>
                    <Input autoFocus required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Living Rooms" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Slug</span>
                    <Input value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} placeholder="Generated automatically" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Small description</span>
                    <Textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="A short introduction to this collection" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <span className="mb-1 block text-sm font-medium">Display order</span>
                      <Input type="number" min="0" value={categoryForm.display_order} onChange={(event) => setCategoryForm({ ...categoryForm, display_order: event.target.value })} placeholder={String(categories.length + 1)} />
                    </label>
                    <label>
                      <span className="mb-1 block text-sm font-medium">Visibility</span>
                      <Select value={categoryForm.is_active} onChange={(event) => setCategoryForm({ ...categoryForm, is_active: event.target.value })}>
                        <option value="true">Visible</option>
                        <option value="false">Hidden</option>
                      </Select>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button disabled={categoryMutations.create.isPending || categoryMutations.update.isPending}>
                      {categoryEditingId ? <Save className="h-4 w-4" /> : <FolderPlus className="h-4 w-4" />}
                      {categoryEditingId ? "Save Changes" : "Add Category"}
                    </Button>
                    {categoryEditingId && <Button type="button" variant="secondary" onClick={resetCategory}>Cancel Edit</Button>}
                  </div>
                </form>
              </div>

              <div className="p-5 md:p-6">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Existing Categories</h3>
                    <p className="text-xs text-slate-500">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
                  </div>
                  <Button type="button" className="h-9 px-3" variant="secondary" onClick={resetCategory}><Plus className="h-4 w-4" /> Add New</Button>
                </div>

                {categories.length ? (
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const count = panoramas.filter((panorama) => panorama.category_id === category.id).length;
                      return (
                        <div key={category.id} className={`rounded-lg border bg-white p-4 transition ${categoryEditingId === category.id ? "border-brand-primary ring-2 ring-orange-100" : "border-slate-200"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-bold text-slate-950">{category.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{count} panorama{count === 1 ? "" : "s"} · Order {category.display_order} · /{category.slug}</div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${category.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{category.is_active ? "Visible" : "Hidden"}</span>
                          </div>
                          {category.description && <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">{category.description}</p>}
                          <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                            <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => editCategory(category)}><Edit3 className="h-4 w-4" /> Edit</Button>
                            <Button type="button" className="h-8 px-3 text-red-600 hover:bg-red-50" variant="ghost" onClick={() => deleteCategory(category)}><Trash2 className="h-4 w-4" /> Delete</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div><FolderPlus className="mx-auto h-8 w-8 text-brand-primary" /><p className="mt-3 font-bold">No categories yet</p><p className="mt-1 text-sm text-slate-500">Use the form to create the first category.</p></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
