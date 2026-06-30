import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TableRow } from "@/types/database";

type Stage = TableRow<"stages">;

const COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#f97316", "#ec4899", "#14b8a6", "#22c55e", "#ef4444"];

const DEFAULT_STAGES = ["Initial Consultation", "Requirement Collection", "Concept Development", "Design Approval", "Blueprint Preparation", "Execution", "Review", "Final Delivery", "Completed"];

export function StagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { profile } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editStage, setEditStage] = useState<Stage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);
  const [form, setForm] = useState({ name: "", description: "", default_progress: 0, default_duration_days: 0, color: "#6366f1", icon: "Star", status: "active" as "active" | "inactive" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("stages").select("*").order("display_order");
    setStages((data as Stage[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (searchParams.get("new") === "1") { openAdd(); setSearchParams({}); } }, [searchParams, setSearchParams]);

  function openAdd() { setEditStage(null); setForm({ name: "", description: "", default_progress: 0, default_duration_days: 7, color: "#6366f1", icon: "Star", status: "active" }); setShowForm(true); }
  function openEdit(stage: Stage) { setEditStage(stage); setForm({ name: stage.name, description: stage.description ?? "", default_progress: stage.default_progress, default_duration_days: stage.default_duration_days ?? 7, color: stage.color ?? "#6366f1", icon: stage.icon ?? "Star", status: stage.status }); setShowForm(true); }

  async function save() {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = { ...form, updated_by: profile?.id };
    if (editStage) {
      const { error } = await supabase.from("stages").update(payload).eq("id", editStage.id);
      if (error) { toast.error("Error", error.message); return; }
      toast.success("Stage updated");
    } else {
      const maxOrder = Math.max(0, ...stages.map((s) => s.display_order));
      const { error } = await supabase.from("stages").insert({ ...payload, display_order: maxOrder + 1, created_by: profile?.id });
      if (error) { toast.error("Error", error.message); return; }
      toast.success("Stage created");
    }
    setShowForm(false);
    load();
  }

  async function deleteStage() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("stages").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Error", error.message); return; }
    toast.success("Stage deleted");
    setDeleteTarget(null);
    load();
  }

  async function toggleStatus(stage: Stage) {
    const newStatus = stage.status === "active" ? "inactive" : "active";
    await supabase.from("stages").update({ status: newStatus }).eq("id", stage.id);
    toast.success(`Stage ${newStatus}`);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Stages</h1>
          <p className="text-sm text-slate-500">{stages.length} stage{stages.length !== 1 ? "s" : ""} defined</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Create Stage</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : stages.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-400 mb-4">No stages defined yet.</p>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Create Stage</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Stage</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 md:table-cell">Progress</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 sm:table-cell">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stages.map((stage) => (
                <tr key={stage.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-300"><GripVertical className="h-4 w-4" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? "#94a3b8" }} />
                      <div>
                        <div className="font-semibold text-slate-900">{stage.name}</div>
                        {stage.description && <div className="text-xs text-slate-400 truncate max-w-xs">{stage.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${stage.default_progress}%` }} /></div>
                      <span className="text-xs text-slate-500">{stage.default_progress}%</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{stage.default_duration_days ? `${stage.default_duration_days} days` : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(stage)} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", stage.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                      {stage.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(stage)} className="grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget(stage)} className="grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setShowForm(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="font-bold text-lg">{editStage ? "Edit Stage" : "Create Stage"}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Stage Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Concept Development" /></div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" placeholder="What happens in this stage?" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Default Progress %</label><Input type="number" min={0} max={100} value={form.default_progress} onChange={(e) => setForm({ ...form, default_progress: Number(e.target.value) })} /></div>
                  <div><label className="block text-sm font-medium mb-1">Duration (days)</label><Input type="number" min={0} value={form.default_duration_days} onChange={(e) => setForm({ ...form, default_duration_days: Number(e.target.value) })} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button key={color} onClick={() => setForm({ ...form, color })} className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110", form.color === color ? "border-slate-900 scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2"><Button onClick={save} className="flex-1">{editStage ? "Update" : "Create"}</Button><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button></div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg">Delete Stage?</h3>
              <p className="mt-2 text-sm text-slate-600">Delete <strong>{deleteTarget.name}</strong>? Existing client stage assignments using this stage will be affected.</p>
              <div className="mt-5 flex gap-3"><Button variant="danger" onClick={deleteStage} className="flex-1">Delete</Button><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
