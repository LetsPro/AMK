import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, EyeOff, FolderPlus, ImageIcon, Loader2, Plus, Save, Trash2, Users, X } from "lucide-react";
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
type PanoramaDraft = { localId: string; category_id: string; title: string; description: string; image_url: string; display_order: string };
type QuickCategoryTarget = { kind: "edit" } | { kind: "draft"; localId: string };

const emptyPanorama = { design_id: "", design_title: "", category_id: "", title: "", description: "", image_url: "", status: "published", is_public: true, display_order: "" };
let panoramaDraftId = 0;

function createPanoramaDraft(displayOrder = ""): PanoramaDraft {
  panoramaDraftId += 1;
  return { localId: `panorama-${panoramaDraftId}`, category_id: "", title: "", description: "", image_url: "", display_order: displayOrder };
}

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
  const batchPanoramaMutations = useTableMutations("panoramas", { toast: false });
  const visibilityMutations = useTableMutations("panoramas", { toast: false });
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
  const [panoramaDrafts, setPanoramaDrafts] = useState<PanoramaDraft[]>(() => [createPanoramaDraft("1")]);
  const [batchClientIds, setBatchClientIds] = useState<string[]>([]);
  const [showBatchClients, setShowBatchClients] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [panoramaEditingId, setPanoramaEditingId] = useState<string | null>(null);
  const [panoramaModalOpen, setPanoramaModalOpen] = useState(false);
  const [quickCategoryTarget, setQuickCategoryTarget] = useState<QuickCategoryTarget | null>(null);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [savingQuickCategory, setSavingQuickCategory] = useState(false);
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
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (quickCategoryTarget) closeQuickCategory();
      else closePanoramaModal();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [panoramaModalOpen, quickCategoryTarget]);

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
    setPanoramaDrafts([createPanoramaDraft(String(panoramas.length + 1))]);
    setBatchClientIds([]);
    setShowBatchClients(false);
    setPanoramaEditingId(null);
    closeQuickCategory();
  }

  function openPanoramaModal() {
    resetPanorama();
    setPanoramaModalOpen(true);
  }

  function closePanoramaModal() {
    resetPanorama();
    setPanoramaModalOpen(false);
  }

  function updatePanoramaDraft(localId: string, changes: Partial<PanoramaDraft>) {
    setPanoramaDrafts((current) => current.map((draft) => draft.localId === localId ? { ...draft, ...changes } : draft));
  }

  function addPanoramaDraft() {
    setPanoramaDrafts((current) => [...current, createPanoramaDraft(String(panoramas.length + current.length + 1))]);
  }

  function removePanoramaDraft(localId: string) {
    setPanoramaDrafts((current) => current.length === 1 ? current : current.filter((draft) => draft.localId !== localId));
  }

  function toggleBatchClient(clientId: string) {
    setBatchClientIds((current) => current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId]);
  }

  function openQuickCategory(target: QuickCategoryTarget) {
    setQuickCategoryTarget(target);
    setQuickCategoryName("");
    setQuickCategoryDescription("");
  }

  function closeQuickCategory() {
    setQuickCategoryTarget(null);
    setQuickCategoryName("");
    setQuickCategoryDescription("");
  }

  async function saveQuickCategory(event: React.FormEvent) {
    event.preventDefault();
    const name = quickCategoryName.trim();
    if (!name || !quickCategoryTarget) return;
    setSavingQuickCategory(true);
    try {
      const created = await categoryMutations.create.mutateAsync({
        name,
        slug: slugify(name),
        description: quickCategoryDescription.trim() || null,
        display_order: categories.length + 1,
        is_active: true
      });
      if (quickCategoryTarget.kind === "edit") {
        setPanoramaForm((current) => ({ ...current, category_id: created.id }));
      } else {
        updatePanoramaDraft(quickCategoryTarget.localId, { category_id: created.id });
      }
      closeQuickCategory();
    } finally {
      setSavingQuickCategory(false);
    }
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
    if (panoramaEditingId) {
      if (!panoramaForm.image_url) {
        window.alert("Please upload or select a panoramic image before saving.");
        return;
      }
      await panoramaMutations.update.mutateAsync({
        id: panoramaEditingId,
        payload: {
          design_title: panoramaForm.design_title.trim(),
          category_id: panoramaForm.category_id,
          title: panoramaForm.title.trim(),
          description: panoramaForm.description.trim() || null,
          image_url: panoramaForm.image_url,
          status: panoramaForm.status as "draft" | "published",
          is_public: panoramaForm.is_public,
          display_order: Number(panoramaForm.display_order || panoramas.length + 1)
        }
      });
      const editedPanorama = panoramas.find((panorama) => panorama.id === panoramaEditingId);
      if (editedPanorama) {
        await Promise.all(panoramas
          .filter((panorama) => panorama.design_id === editedPanorama.design_id && panorama.id !== panoramaEditingId)
          .map((panorama) => batchPanoramaMutations.update.mutateAsync({ id: panorama.id, payload: { design_title: panoramaForm.design_title.trim() } })));
      }
      closePanoramaModal();
      return;
    }

    const incomplete = panoramaDrafts.find((draft) => !draft.category_id || !draft.title.trim() || !draft.image_url);
    if (!panoramaForm.design_title.trim() || incomplete) {
      window.alert("Please add the design title, select a space, add a view label, and choose an image for every panorama.");
      return;
    }

    setSavingBatch(true);
    try {
      const designId = crypto.randomUUID();
      const createdPanoramas: Panorama[] = [];
      for (const [index, draft] of panoramaDrafts.entries()) {
        const created = await batchPanoramaMutations.create.mutateAsync({
          design_id: designId,
          design_title: panoramaForm.design_title.trim(),
          category_id: draft.category_id,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          image_url: draft.image_url,
          status: panoramaForm.status as "draft" | "published",
          is_public: panoramaForm.is_public,
          display_order: Number(draft.display_order || panoramas.length + index + 1)
        });
        createdPanoramas.push(created as Panorama);
      }
      await Promise.all(createdPanoramas.flatMap((panorama) => batchClientIds.map((clientId) => assignmentMutations.create.mutateAsync({ client_id: clientId, panorama_id: panorama.id }))));
      toast.success("360 interiors added", `${createdPanoramas.length} panorama${createdPanoramas.length === 1 ? "" : "s"} created${batchClientIds.length ? ` and assigned to ${batchClientIds.length} client${batchClientIds.length === 1 ? "" : "s"}` : ""}.`);
      closePanoramaModal();
    } catch (error) {
      toast.error("Could not add panoramas", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingBatch(false);
    }
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
      design_id: panorama.design_id,
      design_title: panorama.design_title,
      category_id: panorama.category_id,
      title: panorama.title,
      description: panorama.description ?? "",
      image_url: panorama.image_url,
      status: panorama.status,
      is_public: panorama.is_public !== false,
      display_order: String(panorama.display_order)
    });
  }

  async function toggleWebsiteVisibility(panorama: Panorama) {
    const currentlyVisible = panorama.status === "published" && panorama.is_public !== false;
    const enable = !currentlyVisible;
    try {
      await visibilityMutations.update.mutateAsync({
        id: panorama.id,
        payload: { is_public: enable, ...(enable ? { status: "published" as const } : {}) }
      });
      toast.success(enable ? "Website display enabled" : "Website display disabled", `${panorama.title} ${enable ? "will appear" : "will no longer appear"} on the public website.`);
    } catch (error) {
      toast.error("Visibility update failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  function deleteCategory(category: PanoramaCategory) {
    const count = panoramas.filter((panorama) => panorama.category_id === category.id).length;
    const detail = count ? ` This will also delete ${count} panorama${count === 1 ? "" : "s"} using this space.` : "";
    if (window.confirm(`Delete space “${category.name}”?${detail}`)) categoryMutations.remove.mutate(category.id);
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
          <p className="mt-1 text-sm text-slate-500">Create a design and add multiple panoramic spaces to its interactive 360 viewer.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={openCategoryModal}><FolderPlus className="h-4 w-4" /> Manage Spaces ({categories.length})</Button>
          <Button type="button" onClick={openPanoramaModal}><Plus className="h-4 w-4" /> Add 360 Design</Button>
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
                      <h3 className="font-bold text-slate-950">{panorama.design_title}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">{categoryById.get(panorama.category_id)?.name ?? "Unknown space"} · {panorama.title}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${panorama.status === "published" && panorama.is_public !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{panorama.status === "published" && panorama.is_public !== false ? "Website enabled" : "Website disabled"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{panorama.description || "No description"}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">Order {panorama.display_order}</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button type="button" className="h-8 px-3" variant="ghost" onClick={() => toggleWebsiteVisibility(panorama)}>{panorama.status === "published" && panorama.is_public !== false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {panorama.status === "published" && panorama.is_public !== false ? "Disable website" : "Enable website"}</Button>
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
            <div><ImageIcon className="mx-auto h-8 w-8 text-brand-primary" /><p className="mt-3 font-bold">No 360 designs yet</p><p className="mt-1 text-sm text-slate-500">Create spaces, then add the first 360 design.</p></div>
          </Card>
        )}
      </div>

      {panoramaModalOpen && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm md:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && closePanoramaModal()}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="panorama-editor-title" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">360 Interiors</div>
                <h2 id="panorama-editor-title" className="mt-1 text-2xl font-black text-slate-950">{panoramaEditingId ? "Edit 360 Space" : "Add 360 Interior Design"}</h2>
                <p className="mt-1 text-sm text-slate-500">{panoramaEditingId ? "Update this space inside the 360 design." : "Enter one design title, then add all of its panoramic spaces below."}</p>
              </div>
              <button type="button" onClick={closePanoramaModal} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close 360 interior editor"><X className="h-5 w-5" /></button>
            </div>

            <form className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 md:p-6" onSubmit={savePanorama}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Design title</span>
                <Input autoFocus required value={panoramaForm.design_title} onChange={(event) => setPanoramaForm({ ...panoramaForm, design_title: event.target.value })} placeholder="Modern Villa Interior" />
                <span className="mt-1 block text-xs text-slate-500">This title represents the complete 360 design containing all spaces below.</span>
              </label>
              <div className={`grid gap-4 ${panoramaEditingId ? "md:grid-cols-2" : ""}`}>
                {panoramaEditingId && (
                  <div>
                    <span className="mb-1 block text-sm font-medium">Space</span>
                    <div className="flex gap-2">
                      <Select className="min-w-0 flex-1" required value={panoramaForm.category_id} onChange={(event) => setPanoramaForm({ ...panoramaForm, category_id: event.target.value })}>
                        <option value="">Select space</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                      </Select>
                      <Button type="button" variant="secondary" className="shrink-0 px-3" onClick={() => openQuickCategory({ kind: "edit" })}><FolderPlus className="h-4 w-4" /> New</Button>
                    </div>
                  </div>
                )}
                <label>
                  <span className="mb-1 block text-sm font-medium">Content availability</span>
                  <Select value={panoramaForm.status} onChange={(event) => setPanoramaForm({ ...panoramaForm, status: event.target.value })}>
                    <option value="published">Ready for viewing</option>
                    <option value="draft">Draft / hidden everywhere</option>
                  </Select>
                </label>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={panoramaForm.is_public}
                onClick={() => setPanoramaForm({ ...panoramaForm, is_public: !panoramaForm.is_public })}
                className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition ${panoramaForm.is_public ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
              >
                <span>
                  <span className="block font-bold text-slate-950">Display on public website</span>
                  <span className="mt-1 block text-xs text-slate-500">Client assignments are separate and remain available when website display is disabled.</span>
                </span>
                <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${panoramaForm.is_public ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${panoramaForm.is_public ? "left-6" : "left-1"}`} /></span>
              </button>

              {panoramaEditingId ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-sm font-medium">View label</span>
                    <Input required value={panoramaForm.title} onChange={(event) => setPanoramaForm({ ...panoramaForm, title: event.target.value })} placeholder="Main view" />
                  </label>
                  <label>
                    <span className="mb-1 block text-sm font-medium">Display order</span>
                    <Input type="number" min="0" value={panoramaForm.display_order} onChange={(event) => setPanoramaForm({ ...panoramaForm, display_order: event.target.value })} placeholder={String(panoramas.length + 1)} />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-sm font-medium">Small description</span>
                    <Textarea value={panoramaForm.description} onChange={(event) => setPanoramaForm({ ...panoramaForm, description: event.target.value })} placeholder="Describe the space, materials, or design idea." />
                  </label>
                  <div className="md:col-span-2">
                    <span className="mb-1 block text-sm font-medium">Panoramic image</span>
                    <MediaPicker label="Panoramic image" value={panoramaForm.image_url} onChange={(image_url) => setPanoramaForm({ ...panoramaForm, image_url })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="text-lg font-black text-slate-950">Spaces</h3><p className="text-xs text-slate-500">Add every panoramic space that belongs to this design.</p></div>
                    <Button type="button" variant="secondary" onClick={addPanoramaDraft}><Plus className="h-4 w-4" /> Add Space</Button>
                  </div>
                  {panoramaDrafts.map((draft, index) => (
                    <div key={draft.localId} className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-slate-950">Space {String(index + 1).padStart(2, "0")}</span>
                        {panoramaDrafts.length > 1 && <Button type="button" className="h-8 px-3 text-red-600" variant="ghost" onClick={() => removePanoramaDraft(draft.localId)}><Trash2 className="h-4 w-4" /> Remove</Button>}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_360px_160px]">
                        <label>
                          <span className="mb-1 block text-sm font-medium">View label</span>
                          <Input required value={draft.title} onChange={(event) => updatePanoramaDraft(draft.localId, { title: event.target.value })} placeholder="Main view" />
                        </label>
                        <div>
                          <span className="mb-1 block text-sm font-medium">Space</span>
                          <div className="flex gap-2">
                            <Select className="min-w-0 flex-1" required value={draft.category_id} onChange={(event) => updatePanoramaDraft(draft.localId, { category_id: event.target.value })}>
                              <option value="">Select space</option>
                              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                            </Select>
                            <Button type="button" variant="secondary" className="shrink-0 px-3" onClick={() => openQuickCategory({ kind: "draft", localId: draft.localId })}><FolderPlus className="h-4 w-4" /> New</Button>
                          </div>
                        </div>
                        <label>
                          <span className="mb-1 block text-sm font-medium">Display order</span>
                          <Input type="number" min="0" value={draft.display_order} onChange={(event) => updatePanoramaDraft(draft.localId, { display_order: event.target.value })} />
                        </label>
                        <label className="md:col-span-2 lg:col-span-3">
                          <span className="mb-1 block text-sm font-medium">Small description</span>
                          <Textarea value={draft.description} onChange={(event) => updatePanoramaDraft(draft.localId, { description: event.target.value })} placeholder="Describe this view, materials, or design idea." />
                        </label>
                        <div className="md:col-span-2 lg:col-span-3">
                          <span className="mb-1 block text-sm font-medium">Panoramic image</span>
                          <MediaPicker label={`Panoramic image ${index + 1}`} value={draft.image_url} onChange={(image_url) => updatePanoramaDraft(draft.localId, { image_url })} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-slate-200 bg-white">
                    <button type="button" onClick={() => setShowBatchClients((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                      <span><span className="flex items-center gap-2 font-bold text-slate-950"><Users className="h-4 w-4 text-brand-primary" /> Assign clients</span><span className="mt-1 block text-xs text-slate-500">Selected clients receive every panorama in this batch.</span></span>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-brand-primary">{batchClientIds.length} selected</span>
                    </button>
                    {showBatchClients && (
                      <div className="border-t border-slate-200 p-4">
                        <div className="mb-3 flex justify-end gap-2 text-xs font-bold"><button type="button" onClick={() => setBatchClientIds(clients.map((client) => client.id))} className="text-brand-primary">Select all</button><span className="text-slate-300">·</span><button type="button" onClick={() => setBatchClientIds([])} className="text-slate-500">Clear</button></div>
                        {clients.length ? <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{clients.map((client) => {
                          const selected = batchClientIds.includes(client.id);
                          return <label key={client.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selected ? "border-brand-primary bg-orange-50" : "border-slate-200"}`}><input type="checkbox" checked={selected} onChange={() => toggleBatchClient(client.id)} className="h-4 w-4 accent-orange-600" /><span className="min-w-0 truncate text-sm font-bold text-slate-800">{client.name}</span></label>;
                        })}</div> : <p className="text-sm text-slate-500">No clients are available yet.</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">JPEG or WebP recommended. Maximum upload size is 50 MB per panorama.</p>
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="secondary" onClick={closePanoramaModal}>Cancel</Button>
                <Button disabled={savingBatch || panoramaMutations.update.isPending}>
                  {savingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : panoramaEditingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {panoramaEditingId ? "Save Changes" : `Create Design with ${panoramaDrafts.length} Space${panoramaDrafts.length === 1 ? "" : "s"}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quickCategoryTarget && (
        <div
          className="fixed inset-0 z-[1003] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && closeQuickCategory()}
        >
          <form role="dialog" aria-modal="true" aria-labelledby="quick-category-title" className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={saveQuickCategory}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">360 Interiors</div>
                <h2 id="quick-category-title" className="mt-1 text-xl font-black text-slate-950">Add Space</h2>
                <p className="mt-1 text-sm text-slate-500">Create a space and select it for this panoramic view.</p>
              </div>
              <button type="button" onClick={closeQuickCategory} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close quick category form"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Space name</span>
                <Input autoFocus required value={quickCategoryName} onChange={(event) => setQuickCategoryName(event.target.value)} placeholder="Dining Room" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Small description</span>
                <Textarea value={quickCategoryDescription} onChange={(event) => setQuickCategoryDescription(event.target.value)} placeholder="A short introduction to this collection" />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <Button type="button" variant="secondary" onClick={closeQuickCategory} disabled={savingQuickCategory}>Cancel</Button>
              <Button disabled={savingQuickCategory || !quickCategoryName.trim()}>
                {savingQuickCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                Create &amp; Select
              </Button>
            </div>
          </form>
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
                <h2 id="category-modal-title" className="mt-1 text-2xl font-black text-slate-950">Manage Spaces</h2>
                <p className="mt-1 text-sm text-slate-500">Add, edit, order, hide, or delete spaces such as Living Room, Dining Room, and Bedroom.</p>
              </div>
              <button type="button" onClick={closeCategoryModal} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close category manager"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.85fr_1.15fr]">
              <div className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{categoryEditingId ? "Edit Space" : "Add Space"}</h3>
                    <p className="text-xs text-slate-500">Space names appear as filters and labels inside each 360 design.</p>
                  </div>
                  {categoryEditingId && <Button type="button" className="h-8 px-3" variant="ghost" onClick={resetCategory}><Plus className="h-4 w-4" /> New</Button>}
                </div>

                <form className="space-y-4" onSubmit={saveCategory}>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Space name</span>
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
                      {categoryEditingId ? "Save Changes" : "Add Space"}
                    </Button>
                    {categoryEditingId && <Button type="button" variant="secondary" onClick={resetCategory}>Cancel Edit</Button>}
                  </div>
                </form>
              </div>

              <div className="p-5 md:p-6">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Existing Spaces</h3>
                    <p className="text-xs text-slate-500">{categories.length} space{categories.length === 1 ? "" : "s"}</p>
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
                    <div><FolderPlus className="mx-auto h-8 w-8 text-brand-primary" /><p className="mt-3 font-bold">No spaces yet</p><p className="mt-1 text-sm text-slate-500">Use the form to create the first space.</p></div>
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
