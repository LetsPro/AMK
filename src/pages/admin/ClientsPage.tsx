import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Download, Eye, FileText, Link2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import type { TableRow, ClientStatus } from "@/types/database";

type Client = TableRow<"clients">;
type FileAssignment = TableRow<"client_file_assignments"> & {
  file: { display_name: string; public_url: string; mime_type: string | null; size: number | null } | null;
  stage: { name: string; color: string | null } | null;
};
type BlueprintAssignment = TableRow<"client_blueprint_assignments"> & {
  blueprint: { title: string; url: string } | null;
};
type FileRecord = TableRow<"files">;
type Blueprint = TableRow<"blueprint_links">;
type Stage = TableRow<"stages">;

const STATUS_OPTIONS: ClientStatus[] = ["Active", "On Hold", "Completed", "Inactive"];
const FILE_CATEGORIES = ["Blueprint", "Design", "Report", "Contract", "Invoice", "Other"];

const statusColor: Record<ClientStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "On Hold": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  Inactive: "bg-slate-100 text-slate-500 border-slate-200",
};

type ClientFormData = {
  name: string;
  email: string;
  mobile: string;
  address: string;
  notes: string;
  admin_notes: string;
  status: ClientStatus;
};

const defaultForm: ClientFormData = { name: "", email: "", mobile: "", address: "", notes: "", admin_notes: "", status: "Active" };

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Simple inline combobox for file/blueprint selection
type ComboOption = { id: string; label: string; sub?: string };
function Combobox({ options, value, onChange, placeholder }: { options: ComboOption[]; value: string; onChange: (id: string) => void; placeholder?: string }) {
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
      <button type="button" onClick={() => { setOpen((v) => !v); setQuery(""); }} className={cn("flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 text-sm transition", open ? "border-brand-primary ring-2 ring-orange-100" : "border-slate-200 hover:border-slate-300")}>
        <span className={selected ? "text-slate-900 truncate" : "text-slate-400 truncate"}>{selected ? selected.label : (placeholder ?? "Select...")}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ml-2", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="h-7 w-full rounded border-0 bg-slate-50 pl-6 pr-2 text-xs outline-none" />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400">No results</div>
            ) : filtered.map((o) => (
              <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }} className={cn("flex w-full flex-col items-start px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors", o.id === value && "bg-brand-primary/5 text-brand-primary")}>
                <span className="font-medium">{o.label}</span>
                {o.sub && <span className="text-slate-400 truncate w-full">{o.sub}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  // Detail modal state
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [clientFiles, setClientFiles] = useState<FileAssignment[]>([]);
  const [clientBlueprints, setClientBlueprints] = useState<BlueprintAssignment[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Assign file state
  const [allFiles, setAllFiles] = useState<FileRecord[]>([]);
  const [allBlueprints, setAllBlueprints] = useState<Blueprint[]>([]);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [showAssignFile, setShowAssignFile] = useState(false);
  const [showAssignBlueprint, setShowAssignBlueprint] = useState(false);
  const [fileAssignForm, setFileAssignForm] = useState({ file_id: "", stage_id: "", client_title: "", category: "", can_preview: true, can_download: true });
  const [bpAssignForm, setBpAssignForm] = useState({ blueprint_id: "", stage_id: "", is_visible: true });
  const [savingAssign, setSavingAssign] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients((data as Client[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    if (searchParams.get("new") === "1") { openAdd(); setSearchParams({}); }
  }, [searchParams, setSearchParams]);

  async function openDetail(client: Client) {
    setViewClient(client);
    setClientFiles([]);
    setClientBlueprints([]);
    setShowAssignFile(false);
    setShowAssignBlueprint(false);
    setLoadingFiles(true);

    const [{ data: fData }, { data: bData }, { data: filesData }, { data: bpsData }, { data: stagesData }] = await Promise.all([
      supabase.from("client_file_assignments").select("*, file:files(display_name,public_url,mime_type,size), stage:stages(name,color)").eq("client_id", client.id).order("display_order"),
      supabase.from("client_blueprint_assignments").select("*, blueprint:blueprint_links(title,url)").eq("client_id", client.id),
      supabase.from("files").select("id,display_name,mime_type").is("deleted_at", null).order("display_name"),
      supabase.from("blueprint_links").select("id,title,url").eq("is_active", true).order("title"),
      supabase.from("stages").select("id,name").eq("status", "active").order("display_order"),
    ]);
    setClientFiles((fData as FileAssignment[]) ?? []);
    setClientBlueprints((bData as BlueprintAssignment[]) ?? []);
    setAllFiles((filesData as FileRecord[]) ?? []);
    setAllBlueprints((bpsData as Blueprint[]) ?? []);
    setAllStages((stagesData as Stage[]) ?? []);
    setLoadingFiles(false);
  }

  async function assignFile() {
    if (!viewClient || !fileAssignForm.file_id || !fileAssignForm.client_title.trim()) {
      toast.error("File and title are required");
      return;
    }
    setSavingAssign(true);
    const { error } = await supabase.from("client_file_assignments").insert({
      client_id: viewClient.id,
      file_id: fileAssignForm.file_id,
      stage_id: fileAssignForm.stage_id || null,
      client_title: fileAssignForm.client_title,
      category: fileAssignForm.category || null,
      can_preview: fileAssignForm.can_preview,
      can_download: fileAssignForm.can_download,
      display_order: clientFiles.length,
    });
    if (error) {
      toast.error("Error", error.message);
    } else {
      toast.success("File assigned");
      setFileAssignForm({ file_id: "", stage_id: "", client_title: "", category: "", can_preview: true, can_download: true });
      setShowAssignFile(false);
      const { data } = await supabase.from("client_file_assignments").select("*, file:files(display_name,public_url,mime_type,size), stage:stages(name,color)").eq("client_id", viewClient.id).order("display_order");
      setClientFiles((data as FileAssignment[]) ?? []);
    }
    setSavingAssign(false);
  }

  async function assignBlueprint() {
    if (!viewClient || !bpAssignForm.blueprint_id) {
      toast.error("Select a blueprint");
      return;
    }
    setSavingAssign(true);
    const { error } = await supabase.from("client_blueprint_assignments").insert({
      client_id: viewClient.id,
      blueprint_id: bpAssignForm.blueprint_id,
      stage_id: bpAssignForm.stage_id || null,
      is_visible: bpAssignForm.is_visible,
      display_order: clientBlueprints.length,
    });
    if (error) {
      toast.error("Error", error.message);
    } else {
      toast.success("Blueprint assigned");
      setBpAssignForm({ blueprint_id: "", stage_id: "", is_visible: true });
      setShowAssignBlueprint(false);
      const { data } = await supabase.from("client_blueprint_assignments").select("*, blueprint:blueprint_links(title,url)").eq("client_id", viewClient.id);
      setClientBlueprints((data as BlueprintAssignment[]) ?? []);
    }
    setSavingAssign(false);
  }

  async function removeFileAssignment(id: string) {
    await supabase.from("client_file_assignments").delete().eq("id", id);
    setClientFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success("File assignment removed");
  }

  async function removeBlueprintAssignment(id: string) {
    await supabase.from("client_blueprint_assignments").delete().eq("id", id);
    setClientBlueprints((prev) => prev.filter((b) => b.id !== id));
    toast.success("Blueprint assignment removed");
  }

  const filtered = clients.filter((c) => {
    const matchSearch = `${c.name} ${c.email ?? ""} ${c.mobile ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openAdd() { setEditClient(null); setForm(defaultForm); setShowForm(true); }
  function openEdit(client: Client) {
    setEditClient(client);
    setForm({ name: client.name, email: client.email ?? "", mobile: client.mobile ?? "", address: client.address ?? "", notes: client.notes ?? "", admin_notes: client.admin_notes ?? "", status: client.status as ClientStatus });
    setShowForm(true);
  }

  async function saveClient() {
    if (!form.name.trim()) { toast.error("Name required", "Client name cannot be empty."); return; }
    setSaving(true);
    try {
      if (editClient) {
        const { error } = await supabase.from("clients").update(form).eq("id", editClient.id);
        if (error) throw error;
        toast.success("Client updated");
      } else {
        const { error } = await supabase.from("clients").insert(form);
        if (error) throw error;
        toast.success("Client created");
      }
      setShowForm(false);
      fetchClients();
    } catch (err) {
      toast.error("Error", (err as { message?: string })?.message ?? "Save failed");
    }
    setSaving(false);
  }

  async function deleteClient() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("clients").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Error", error.message); return; }
    toast.success("Client deleted");
    setDeleteTarget(null);
    fetchClients();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{clients.length} total client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Client</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1.5">
          {(["All", ...STATUS_OPTIONS] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", statusFilter === s ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-slate-50" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-semibold text-slate-700">No clients found</p>
            <p className="mt-1 text-sm text-slate-400">{search || statusFilter !== "All" ? "Try adjusting your filters." : "Add your first client to get started."}</p>
            {!search && statusFilter === "All" && <Button className="mt-4" onClick={openAdd}><Plus className="h-4 w-4" /> Add Client</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-sm font-bold text-brand-primary">
                          {client.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{client.name}</div>
                          {client.email && <div className="text-xs text-slate-400">{client.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-700">{client.email ?? "—"}</div>
                      <div className="text-xs text-slate-400">{client.mobile ?? ""}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusColor[client.status as ClientStatus] ?? "bg-slate-100 text-slate-500")}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(client)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(client)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(client)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {viewClient && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/50" onClick={() => setViewClient(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ type: "spring", stiffness: 340, damping: 30 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl pointer-events-auto">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-xl font-black text-brand-primary">
                      {viewClient.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{viewClient.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusColor[viewClient.status as ClientStatus] ?? "bg-slate-100 text-slate-500")}>
                          {viewClient.status}
                        </span>
                        {viewClient.customer_id && <span className="text-xs text-slate-400 font-mono">{viewClient.customer_id}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setViewClient(null); openEdit(viewClient); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setViewClient(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 transition-colors">
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Email</div>
                        <div className="text-sm font-medium text-slate-800">{viewClient.email || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Phone</div>
                        <div className="text-sm font-medium text-slate-800">{viewClient.mobile || "—"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-slate-400 mb-0.5">Address</div>
                        <div className="text-sm font-medium text-slate-800">{viewClient.address || "—"}</div>
                      </div>
                      {viewClient.contract_value != null && (
                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Contract Value</div>
                          <div className="text-sm font-medium text-slate-800">
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(viewClient.contract_value)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {(viewClient.notes || viewClient.admin_notes) && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Notes</h3>
                      <div className="space-y-3">
                        {viewClient.notes && (
                          <div className="rounded-lg bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold text-slate-500 mb-1">Client Notes</div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewClient.notes}</p>
                          </div>
                        )}
                        {viewClient.admin_notes && (
                          <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                            <div className="text-xs font-semibold text-amber-600 mb-1">Internal Notes (admin only)</div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewClient.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Files */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Files {!loadingFiles && `(${clientFiles.length})`}
                      </h3>
                      <button onClick={() => { setShowAssignFile((v) => !v); setShowAssignBlueprint(false); }} className={cn("text-xs font-semibold rounded-lg px-2.5 py-1 transition-colors", showAssignFile ? "bg-brand-primary text-white" : "text-brand-primary hover:bg-brand-primary/10")}>
                        {showAssignFile ? "Cancel" : "+ Assign File"}
                      </button>
                    </div>

                    {/* Assign File Form */}
                    <AnimatePresence>
                      {showAssignFile && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mb-3 rounded-xl border border-brand-primary/20 bg-orange-50/50 p-4 space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assign a File</p>
                            <Combobox
                              options={allFiles.map((f) => ({ id: f.id, label: f.display_name, sub: f.mime_type ?? undefined }))}
                              value={fileAssignForm.file_id}
                              onChange={(id) => {
                                const f = allFiles.find((x) => x.id === id);
                                setFileAssignForm((prev) => ({ ...prev, file_id: id, client_title: f?.display_name ?? prev.client_title }));
                              }}
                              placeholder="Select file..."
                            />
                            <Input value={fileAssignForm.client_title} onChange={(e) => setFileAssignForm((p) => ({ ...p, client_title: e.target.value }))} placeholder="Title shown to client *" className="h-9" />
                            <div className="grid grid-cols-2 gap-2">
                              <select value={fileAssignForm.category} onChange={(e) => setFileAssignForm((p) => ({ ...p, category: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs focus:border-brand-primary focus:outline-none">
                                <option value="">Category</option>
                                {FILE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <select value={fileAssignForm.stage_id} onChange={(e) => setFileAssignForm((p) => ({ ...p, stage_id: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs focus:border-brand-primary focus:outline-none">
                                <option value="">No stage</option>
                                {allStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input type="checkbox" checked={fileAssignForm.can_preview} onChange={(e) => setFileAssignForm((p) => ({ ...p, can_preview: e.target.checked }))} className="accent-brand-primary" /> Preview
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input type="checkbox" checked={fileAssignForm.can_download} onChange={(e) => setFileAssignForm((p) => ({ ...p, can_download: e.target.checked }))} className="accent-brand-primary" /> Download
                              </label>
                            </div>
                            <Button onClick={assignFile} disabled={savingAssign} className="w-full">{savingAssign ? "Assigning..." : "Assign File"}</Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loadingFiles ? (
                      <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
                    ) : clientFiles.length === 0 && !showAssignFile ? (
                      <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                        <FileText className="mx-auto h-7 w-7 text-slate-300 mb-1.5" />
                        <p className="text-xs text-slate-400">No files assigned yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {clientFiles.map((fa) => (
                          <div key={fa.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">{fa.client_title || fa.file?.display_name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {fa.category && <span className="text-xs text-slate-400">{fa.category}</span>}
                                {fa.file?.size && <span className="text-xs text-slate-400">{formatSize(fa.file.size)}</span>}
                                {fa.stage && (
                                  <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: fa.stage.color ?? "#94a3b8" }} />{fa.stage.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {fa.can_download && fa.file && (
                                <a href={fa.file.public_url} download target="_blank" rel="noopener noreferrer" className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:text-emerald-600 transition-colors">
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button onClick={() => removeFileAssignment(fa.id)} className="grid h-7 w-7 place-items-center rounded text-slate-300 hover:text-red-500 transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Blueprints */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Blueprints {!loadingFiles && `(${clientBlueprints.length})`}
                      </h3>
                      <button onClick={() => { setShowAssignBlueprint((v) => !v); setShowAssignFile(false); }} className={cn("text-xs font-semibold rounded-lg px-2.5 py-1 transition-colors", showAssignBlueprint ? "bg-brand-primary text-white" : "text-brand-primary hover:bg-brand-primary/10")}>
                        {showAssignBlueprint ? "Cancel" : "+ Assign Blueprint"}
                      </button>
                    </div>

                    {/* Assign Blueprint Form */}
                    <AnimatePresence>
                      {showAssignBlueprint && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mb-3 rounded-xl border border-brand-primary/20 bg-orange-50/50 p-4 space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assign a Blueprint</p>
                            <Combobox
                              options={allBlueprints.map((b) => ({ id: b.id, label: b.title, sub: b.url }))}
                              value={bpAssignForm.blueprint_id}
                              onChange={(id) => setBpAssignForm((p) => ({ ...p, blueprint_id: id }))}
                              placeholder="Select blueprint..."
                            />
                            <select value={bpAssignForm.stage_id} onChange={(e) => setBpAssignForm((p) => ({ ...p, stage_id: e.target.value }))} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs focus:border-brand-primary focus:outline-none">
                              <option value="">No stage</option>
                              {allStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input type="checkbox" checked={bpAssignForm.is_visible} onChange={(e) => setBpAssignForm((p) => ({ ...p, is_visible: e.target.checked }))} className="accent-brand-primary" /> Visible to client
                            </label>
                            <Button onClick={assignBlueprint} disabled={savingAssign} className="w-full">{savingAssign ? "Assigning..." : "Assign Blueprint"}</Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loadingFiles ? (
                      <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
                    ) : clientBlueprints.length === 0 && !showAssignBlueprint ? (
                      <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                        <Link2 className="mx-auto h-7 w-7 text-slate-300 mb-1.5" />
                        <p className="text-xs text-slate-400">No blueprints assigned yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {clientBlueprints.map((ba) => (
                          <div key={ba.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                            <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">{ba.blueprint?.title ?? "—"}</div>
                              {ba.blueprint?.url && <div className="text-xs text-slate-400 truncate">{ba.blueprint.url}</div>}
                            </div>
                            <button onClick={() => removeBlueprintAssignment(ba.id)} className="grid h-7 w-7 place-items-center rounded text-slate-300 hover:text-red-500 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Added {new Date(viewClient.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      {viewClient.auth_user_id && <span className="font-mono">Portal access enabled</span>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setShowForm(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="font-bold text-lg">{editClient ? "Edit Client" : "Add Client"}</h2>
                <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name or company name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="+91 00000 00000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Project or billing address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Notes (visible to client)</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes visible to the client..." className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes (admin only)</label>
                  <textarea value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} placeholder="Internal notes not visible to client..." className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={saveClient} disabled={saving} className="flex-1">{saving ? "Saving..." : editClient ? "Update Client" : "Create Client"}</Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg text-slate-900">Delete Client?</h3>
              <p className="mt-2 text-sm text-slate-600">This will permanently delete <strong>{deleteTarget.name}</strong> and all associated data including file assignments.</p>
              <div className="mt-5 flex gap-3">
                <Button variant="danger" onClick={deleteClient} className="flex-1">Delete Client</Button>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
