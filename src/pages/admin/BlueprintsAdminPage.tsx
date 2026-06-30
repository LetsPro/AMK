import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TableRow } from "@/types/database";

type Blueprint = TableRow<"blueprint_links"> & {
  _assignments?: { client: { name: string } | null }[];
};
type Client = TableRow<"clients">;
type Assignment = TableRow<"client_blueprint_assignments"> & {
  client: { name: string } | null;
};

type FormData = { title: string; url: string; description: string; is_active: boolean };
type AssignFormData = { client_id: string; client_project_id: string; stage_id: string; display_order: number; is_visible: boolean };

const defaultForm: FormData = { title: "", url: "", description: "", is_active: true };
const defaultAssignForm: AssignFormData = { client_id: "", client_project_id: "", stage_id: "", display_order: 0, is_visible: true };

export function BlueprintsAdminPage() {
  const toast = useToast();
  const { profile } = useAuth();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editItem, setEditItem] = useState<Blueprint | null>(null);
  const [assignTarget, setAssignTarget] = useState<Blueprint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Blueprint | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [assignForm, setAssignForm] = useState<AssignFormData>(defaultAssignForm);
  const [blueprintAssignments, setBlueprintAssignments] = useState<Assignment[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: bData }, { data: cData }] = await Promise.all([
      supabase.from("blueprint_links").select("*, _assignments:client_blueprint_assignments(client:clients(name))").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("name"),
    ]);
    setBlueprints((bData as Blueprint[]) ?? []);
    setClients((cData as Client[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadAssignments(blueprintId: string) {
    const { data } = await supabase.from("client_blueprint_assignments").select("*, client:clients(name)").eq("blueprint_id", blueprintId);
    setBlueprintAssignments((data as Assignment[]) ?? []);
  }

  function openAdd() { setEditItem(null); setForm(defaultForm); setShowForm(true); }
  function openEdit(b: Blueprint) { setEditItem(b); setForm({ title: b.title, url: b.url, description: b.description ?? "", is_active: b.is_active }); setShowForm(true); }
  function openAssign(b: Blueprint) { setAssignTarget(b); setAssignForm(defaultAssignForm); loadAssignments(b.id); setShowAssignForm(true); }

  async function save() {
    if (!form.title.trim() || !form.url.trim()) { toast.error("Title and URL are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, updated_by: profile?.id };
      if (editItem) {
        const { error } = await supabase.from("blueprint_links").update(payload).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Blueprint updated");
      } else {
        const { error } = await supabase.from("blueprint_links").insert({ ...payload, created_by: profile?.id });
        if (error) throw error;
        toast.success("Blueprint created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error("Error", err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  async function toggleActive(b: Blueprint) {
    await supabase.from("blueprint_links").update({ is_active: !b.is_active }).eq("id", b.id);
    toast.success(`Blueprint ${!b.is_active ? "activated" : "deactivated"}`);
    load();
  }

  async function deleteBlueprint() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("blueprint_links").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Error", error.message); return; }
    toast.success("Blueprint deleted");
    setDeleteTarget(null);
    load();
  }

  async function saveAssignment() {
    if (!assignForm.client_id || !assignTarget) { toast.error("Select a client"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("client_blueprint_assignments").insert({
        blueprint_id: assignTarget.id,
        client_id: assignForm.client_id,
        client_project_id: assignForm.client_project_id || null,
        stage_id: assignForm.stage_id || null,
        display_order: assignForm.display_order,
        is_visible: assignForm.is_visible,
        created_by: profile?.id,
      });
      if (error) throw error;
      toast.success("Blueprint assigned");
      loadAssignments(assignTarget.id);
      setAssignForm(defaultAssignForm);
    } catch (err) {
      toast.error("Error", err instanceof Error ? err.message : "Assignment failed");
    }
    setSaving(false);
  }

  async function removeAssignment(id: string) {
    await supabase.from("client_blueprint_assignments").delete().eq("id", id);
    toast.success("Assignment removed");
    if (assignTarget) loadAssignments(assignTarget.id);
  }

  const filtered = blueprints.filter((b) => `${b.title} ${b.url} ${b.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Blueprint Links</h1>
          <p className="text-sm text-slate-500">{blueprints.length} link{blueprints.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Blueprint</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Search blueprints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-300">
          <ExternalLink className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No blueprint links yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="h-4 w-4" /> Add Blueprint</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Title</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 md:table-cell">URL</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Assigned To</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{b.title}</div>
                    {b.description && <div className="text-xs text-slate-400 truncate max-w-xs">{b.description}</div>}
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline truncate max-w-xs text-xs">
                      <ExternalLink className="h-3 w-3 shrink-0" />{b.url}
                    </a>
                  </td>
                  <td className="px-5 py-3.5">
                    {b._assignments && b._assignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {b._assignments.slice(0, 3).map((a, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">{a.client?.name ?? "—"}</span>
                        ))}
                        {b._assignments.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">+{b._assignments.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(b)} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", b.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                      {b.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openAssign(b)} className="rounded px-2.5 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 transition-colors">Assign</button>
                      <button onClick={() => openEdit(b)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget(b)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blueprint Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setShowForm(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="font-bold text-lg">{editItem ? "Edit Blueprint" : "Add Blueprint"}</h2>
                <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Floor Plan v3" /></div>
                <div><label className="block text-sm font-medium mb-1">URL *</label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" placeholder="Brief description..." /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded accent-brand-primary" />
                  <span className="text-sm text-slate-700">Active (visible to clients)</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Saving..." : editItem ? "Update" : "Create"}</Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Assign Drawer */}
      <AnimatePresence>
        {showAssignForm && assignTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setShowAssignForm(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="font-bold text-lg">Assign Blueprint</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{assignTarget.title}</p>
                </div>
                <button onClick={() => setShowAssignForm(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client *</label>
                  <select value={assignForm.client_id} onChange={(e) => setAssignForm({ ...assignForm, client_id: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <Input type="number" min={0} value={assignForm.display_order} onChange={(e) => setAssignForm({ ...assignForm, display_order: Number(e.target.value) })} />
                  </div>
                  <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input type="checkbox" checked={assignForm.is_visible} onChange={(e) => setAssignForm({ ...assignForm, is_visible: e.target.checked })} className="h-4 w-4 rounded accent-brand-primary" />
                    <span className="text-sm text-slate-700">Visible</span>
                  </label>
                </div>
                <Button onClick={saveAssignment} disabled={saving} className="w-full">{saving ? "Assigning..." : "Assign to Client"}</Button>

                {blueprintAssignments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Current Assignments</p>
                    <div className="space-y-2">
                      {blueprintAssignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span className="text-sm text-slate-700">{a.client?.name}</span>
                          <button onClick={() => removeAssignment(a.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg">Delete Blueprint?</h3>
              <p className="mt-2 text-sm text-slate-600">Delete <strong>{deleteTarget.title}</strong>? All client assignments for this blueprint will also be removed.</p>
              <div className="mt-5 flex gap-3">
                <Button variant="danger" onClick={deleteBlueprint} className="flex-1">Delete</Button>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
