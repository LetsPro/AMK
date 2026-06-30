import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Link2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TableRow } from "@/types/database";

type SearchSelectOption = { id: string; label: string; sub?: string };

function SearchSelect({ label, value, options, onChange, placeholder }: {
  label: string;
  value: string;
  options: SearchSelectOption[];
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) => `${o.label} ${o.sub ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handler(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <button type="button" onClick={() => { setOpen((v) => !v); setQuery(""); }} className={cn("flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-sm transition", open ? "border-brand-primary ring-4 ring-orange-100" : "border-slate-200 hover:border-slate-300")}>
        <span className={selected ? "text-slate-900" : "text-slate-400"}>{selected ? selected.label : (placeholder ?? "Select...")}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="h-8 w-full rounded border-0 bg-slate-50 pl-7 pr-3 text-sm outline-none focus:bg-white" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {value && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="flex w-full items-center px-3 py-2 text-sm text-slate-400 hover:bg-slate-50">
                Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">No results</div>
            ) : filtered.map((o) => (
              <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }} className={cn("flex w-full flex-col items-start px-3 py-2 text-sm hover:bg-slate-50 transition-colors", o.id === value && "bg-brand-primary/5 text-brand-primary")}>
                <span className="font-medium">{o.label}</span>
                {o.sub && <span className="text-xs text-slate-400 truncate w-full">{o.sub}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Assignment = TableRow<"client_file_assignments"> & {
  file: { display_name: string; mime_type: string | null } | null;
  client: { name: string } | null;
  stage: { name: string; color: string | null } | null;
};
type Client = TableRow<"clients">;
type File = TableRow<"files">;

type FormData = {
  file_id: string;
  client_id: string;
  client_title: string;
  client_description: string;
  category: string;
  display_order: number;
  can_preview: boolean;
  can_download: boolean;
  visible_from: string;
  expires_at: string;
};

const defaultForm: FormData = {
  file_id: "",
  client_id: "",
  client_title: "",
  client_description: "",
  category: "",
  display_order: 0,
  can_preview: true,
  can_download: true,
  visible_from: "",
  expires_at: "",
};

const CATEGORIES = ["Blueprint", "Design", "Report", "Contract", "Invoice", "Other"];

export function AssignmentsPage() {
  const toast = useToast();
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: aData }, { data: cData }, { data: fData }] = await Promise.all([
      supabase.from("client_file_assignments").select("*, file:files(display_name,mime_type), client:clients(name), stage:stages(name,color)").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("name"),
      supabase.from("files").select("*").is("deleted_at", null).order("display_name"),
    ]);
    setAssignments((aData as Assignment[]) ?? []);
    setClients((cData as Client[]) ?? []);
    setFiles((fData as File[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditItem(null); setForm(defaultForm); setShowForm(true); }
  function openEdit(a: Assignment) {
    setEditItem(a);
    setForm({
      file_id: a.file_id,
      client_id: a.client_id,
      client_title: a.client_title,
      client_description: a.client_description ?? "",
      category: a.category ?? "",
      display_order: a.display_order,
      can_preview: a.can_preview,
      can_download: a.can_download,
      visible_from: a.visible_from ? a.visible_from.slice(0, 10) : "",
      expires_at: a.expires_at ? a.expires_at.slice(0, 10) : "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.file_id || !form.client_id || !form.client_title.trim()) {
      toast.error("Required fields missing", "File, client, and title are required.");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const { error } = await supabase.from("client_file_assignments").update({
          file_id: form.file_id,
          client_id: form.client_id,
          client_title: form.client_title,
          client_description: form.client_description || null,
          category: form.category || null,
          display_order: form.display_order,
          can_preview: form.can_preview,
          can_download: form.can_download,
          visible_from: form.visible_from || null,
          expires_at: form.expires_at || null,
          updated_by: profile?.id ?? null,
        }).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Assignment updated");
      } else {
        const { error } = await supabase.from("client_file_assignments").insert({
          file_id: form.file_id,
          client_id: form.client_id,
          client_title: form.client_title,
          client_description: form.client_description || null,
          category: form.category || null,
          display_order: form.display_order,
          can_preview: form.can_preview,
          can_download: form.can_download,
          visible_from: form.visible_from || null,
          expires_at: form.expires_at || null,
          created_by: profile?.id ?? null,
        });
        if (error) throw error;
        toast.success("Assignment created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Save failed";
      toast.error("Error", msg);
    }
    setSaving(false);
  }

  async function deleteAssignment() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("client_file_assignments").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Error", error.message); return; }
    toast.success("Assignment deleted");
    setDeleteTarget(null);
    load();
  }

  const filtered = assignments.filter((a) => {
    const matchSearch = `${a.client_title} ${a.client?.name ?? ""} ${a.file?.display_name ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchClient = !filterClient || a.client_id === filterClient;
    return matchSearch && matchClient;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">File Assignments</h1>
          <p className="text-sm text-slate-500">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> New Assignment</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-slate-50" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Link2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No assignments found</p>
            <p className="mt-1 text-sm text-slate-400">{search || filterClient ? "Adjust your filters." : "Assign your first file to a client."}</p>
            {!search && !filterClient && <Button className="mt-4" onClick={openAdd}><Plus className="h-4 w-4" /> New Assignment</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">File / Title</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 md:table-cell">Stage</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 lg:table-cell">Permissions</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{a.client_title}</div>
                      <div className="text-xs text-slate-400">{a.file?.display_name ?? "—"}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{a.client?.name ?? "—"}</td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      {a.stage ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.stage.color ?? "#94a3b8" }} />
                          <span className="text-sm text-slate-600">{a.stage.name}</span>
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      <div className="flex gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", a.can_preview ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}>{a.can_preview ? "Preview" : "No Preview"}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", a.can_download ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>{a.can_download ? "Download" : "No Download"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(a)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setShowForm(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="font-bold text-lg">{editItem ? "Edit Assignment" : "New Assignment"}</h2>
                <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <SearchSelect
                  label="Client *"
                  value={form.client_id}
                  options={clients.map((c) => ({ id: c.id, label: c.name, sub: c.email ?? c.mobile ?? undefined }))}
                  onChange={(id) => setForm({ ...form, client_id: id })}
                  placeholder="Search and select client..."
                />
                <SearchSelect
                  label="File *"
                  value={form.file_id}
                  options={files.map((f) => ({ id: f.id, label: f.display_name, sub: f.mime_type ?? undefined }))}
                  onChange={(id) => setForm({ ...form, file_id: id })}
                  placeholder="Search and select file..."
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client-Facing Title *</label>
                  <Input value={form.client_title} onChange={(e) => setForm({ ...form, client_title: e.target.value })} placeholder="Title shown to client" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client-Facing Description</label>
                  <textarea value={form.client_description} onChange={(e) => setForm({ ...form, client_description: e.target.value })} className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" placeholder="Description shown to client..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
                      <option value="">None</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                    <Input type="number" min={0} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Visible From</label>
                    <Input type="date" value={form.visible_from} onChange={(e) => setForm({ ...form, visible_from: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expires At</label>
                    <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.can_preview} onChange={(e) => setForm({ ...form, can_preview: e.target.checked })} className="h-4 w-4 rounded accent-brand-primary" />
                    <span className="text-sm text-slate-700">Allow Preview</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.can_download} onChange={(e) => setForm({ ...form, can_download: e.target.checked })} className="h-4 w-4 rounded accent-brand-primary" />
                    <span className="text-sm text-slate-700">Allow Download</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Saving..." : editItem ? "Update" : "Create"}</Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg text-slate-900">Delete Assignment?</h3>
              <p className="mt-2 text-sm text-slate-600">Remove the assignment <strong>{deleteTarget.client_title}</strong> for <strong>{deleteTarget.client?.name}</strong>? The file itself will not be deleted.</p>
              <div className="mt-5 flex gap-3">
                <Button variant="danger" onClick={deleteAssignment} className="flex-1">Delete</Button>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
