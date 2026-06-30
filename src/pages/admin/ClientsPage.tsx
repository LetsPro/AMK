import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Eye, EyeOff, ExternalLink, FileText, KeyRound, Link2, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TableRow, ClientStatus } from "@/types/database";

type Client = TableRow<"clients">;
type FileAssignment = TableRow<"client_file_assignments"> & {
  file: { display_name: string; public_url: string; mime_type: string | null; size: number | null } | null;
};
type BlueprintAssignment = TableRow<"client_blueprint_assignments"> & {
  blueprint: { title: string; url: string } | null;
};
type Stage = TableRow<"stages">;

const STATUS_OPTIONS: ClientStatus[] = ["Active", "On Hold", "Completed", "Inactive"];

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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  // Portal credentials
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  // Detail modal
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [clientFiles, setClientFiles] = useState<FileAssignment[]>([]);
  const [clientBlueprints, setClientBlueprints] = useState<BlueprintAssignment[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // File upload per stage
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingStageId = useRef<string | null>(null);
  const [uploadingStageId, setUploadingStageId] = useState<string | null>(null);

  // Blueprint add form
  const [showBpForm, setShowBpForm] = useState(false);
  const [bpForm, setBpForm] = useState({ title: "", url: "" });
  const [savingBp, setSavingBp] = useState(false);

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
    setShowBpForm(false);
    setBpForm({ title: "", url: "" });
    setLoadingDetail(true);

    const [{ data: fData }, { data: bData }, { data: sData }] = await Promise.all([
      supabase.from("client_file_assignments")
        .select("*, file:files(display_name,public_url,mime_type,size)")
        .eq("client_id", client.id)
        .order("display_order"),
      supabase.from("client_blueprint_assignments")
        .select("*, blueprint:blueprint_links(title,url)")
        .eq("client_id", client.id)
        .order("display_order"),
      supabase.from("stages").select("*").eq("status", "active").order("display_order"),
    ]);

    setClientFiles((fData as FileAssignment[]) ?? []);
    setClientBlueprints((bData as BlueprintAssignment[]) ?? []);
    setStages((sData as Stage[]) ?? []);
    setLoadingDetail(false);
  }

  async function reloadDetail(clientId: string) {
    const [{ data: fData }, { data: bData }] = await Promise.all([
      supabase.from("client_file_assignments")
        .select("*, file:files(display_name,public_url,mime_type,size)")
        .eq("client_id", clientId)
        .order("display_order"),
      supabase.from("client_blueprint_assignments")
        .select("*, blueprint:blueprint_links(title,url)")
        .eq("client_id", clientId)
        .order("display_order"),
    ]);
    setClientFiles((fData as FileAssignment[]) ?? []);
    setClientBlueprints((bData as BlueprintAssignment[]) ?? []);
  }

  function triggerUpload(stageId: string) {
    pendingStageId.current = stageId;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const stageId = pendingStageId.current;
    if (!file || !viewClient || !stageId) return;
    e.target.value = "";

    setUploadingStageId(stageId);
    try {
      const path = `clients/${viewClient.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);

      const { data: fileRow, error: fErr } = await supabase.from("files").insert({
        original_name: file.name,
        display_name: file.name,
        storage_path: path,
        public_url: publicUrl,
        mime_type: file.type,
        size: file.size,
        bucket: "documents",
        created_by: profile?.id ?? null,
      }).select("id").single();
      if (fErr) throw fErr;

      const { error: aErr } = await supabase.from("client_file_assignments").insert({
        client_id: viewClient.id,
        file_id: (fileRow as { id: string }).id,
        stage_id: stageId === "unassigned" ? null : stageId,
        client_title: file.name,
        can_preview: true,
        can_download: true,
        display_order: clientFiles.filter(f => f.stage_id === (stageId === "unassigned" ? null : stageId)).length,
        created_by: profile?.id ?? null,
      });
      if (aErr) throw aErr;

      toast.success("File uploaded");
      await reloadDetail(viewClient.id);
    } catch (err) {
      toast.error("Upload failed", (err as { message?: string })?.message ?? "Unknown error");
    }
    setUploadingStageId(null);
    pendingStageId.current = null;
  }

  async function removeFileAssignment(id: string) {
    await supabase.from("client_file_assignments").delete().eq("id", id);
    setClientFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function addBlueprint() {
    if (!viewClient || !bpForm.title.trim() || !bpForm.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    setSavingBp(true);
    try {
      const { data: bp, error: bpErr } = await supabase.from("blueprint_links").insert({
        title: bpForm.title,
        url: bpForm.url,
        is_active: true,
        created_by: profile?.id ?? null,
      }).select("id").single();
      if (bpErr) throw bpErr;

      const { error: aErr } = await supabase.from("client_blueprint_assignments").insert({
        client_id: viewClient.id,
        blueprint_id: (bp as { id: string }).id,
        is_visible: true,
        display_order: clientBlueprints.length,
        created_by: profile?.id ?? null,
      });
      if (aErr) throw aErr;

      toast.success("Blueprint added");
      setBpForm({ title: "", url: "" });
      setShowBpForm(false);
      await reloadDetail(viewClient.id);
    } catch (err) {
      toast.error("Error", (err as { message?: string })?.message ?? "Failed");
    }
    setSavingBp(false);
  }

  async function removeBlueprint(assignmentId: string) {
    await supabase.from("client_blueprint_assignments").delete().eq("id", assignmentId);
    setClientBlueprints((prev) => prev.filter((b) => b.id !== assignmentId));
  }

  const filtered = clients.filter((c) => {
    const matchSearch = `${c.name} ${c.email ?? ""} ${c.mobile ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openAdd() {
    setEditClient(null);
    setForm(defaultForm);
    setPortalEmail("");
    setPortalPassword("");
    setShowPortalPassword(false);
    setShowForm(true);
  }

  function openEdit(client: Client) {
    setEditClient(client);
    setForm({ name: client.name, email: client.email ?? "", mobile: client.mobile ?? "", address: client.address ?? "", notes: client.notes ?? "", admin_notes: client.admin_notes ?? "", status: client.status as ClientStatus });
    setPortalEmail("");
    setPortalPassword("");
    setShowPortalPassword(false);
    setShowForm(true);
  }

  async function saveClient() {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      if (editClient) {
        const { error } = await supabase.from("clients").update(form).eq("id", editClient.id);
        if (error) throw error;
        if (portalEmail && portalPassword) {
          if (portalPassword.length < 8) throw new Error("Password must be at least 8 characters");
          const { data: fn, error: fnErr } = await supabase.functions.invoke("create-portal-user", {
            body: { email: portalEmail, password: portalPassword, full_name: form.name, existing_user_id: editClient.auth_user_id ?? null },
          });
          if (fnErr) throw new Error(fnErr.message);
          if (fn?.error) throw new Error(fn.error);
          if (fn?.user_id) await supabase.from("clients").update({ auth_user_id: fn.user_id }).eq("id", editClient.id);
        }
        toast.success("Client updated");
      } else {
        const { data: newClient, error } = await supabase.from("clients").insert(form).select("id").single();
        if (error) throw error;
        const clientId = (newClient as { id: string }).id;
        if (portalEmail && portalPassword) {
          if (portalPassword.length < 8) throw new Error("Password must be at least 8 characters");
          const { data: fn, error: fnErr } = await supabase.functions.invoke("create-portal-user", {
            body: { email: portalEmail, password: portalPassword, full_name: form.name },
          });
          if (fnErr) throw new Error(fnErr.message);
          if (fn?.error) throw new Error(fn.error);
          if (fn?.user_id) await supabase.from("clients").update({ auth_user_id: fn.user_id }).eq("id", clientId);
        }
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
      {/* Hidden file input for stage uploads */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />

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
          <div className="divide-y divide-slate-100">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-slate-50" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
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
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDetail(client)}>
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
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusColor[client.status as ClientStatus] ?? "bg-slate-100 text-slate-500")}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(client)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(client)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(client)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
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

      {/* ── CLIENT DETAIL MODAL ── */}
      <AnimatePresence>
        {viewClient && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/50" onClick={() => setViewClient(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl pointer-events-auto">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-lg font-black text-brand-primary">
                      {viewClient.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{viewClient.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", statusColor[viewClient.status as ClientStatus])}>
                          {viewClient.status}
                        </span>
                        {viewClient.auth_user_id && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Portal active</span>}
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
                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><div className="text-xs text-slate-400 mb-0.5">Email</div><div className="font-medium text-slate-800">{viewClient.email || "—"}</div></div>
                    <div><div className="text-xs text-slate-400 mb-0.5">Phone</div><div className="font-medium text-slate-800">{viewClient.mobile || "—"}</div></div>
                    {viewClient.address && <div className="col-span-2"><div className="text-xs text-slate-400 mb-0.5">Address</div><div className="font-medium text-slate-800">{viewClient.address}</div></div>}
                  </div>

                  {/* Notes */}
                  {(viewClient.notes || viewClient.admin_notes) && (
                    <div className="space-y-2">
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
                  )}

                  {/* ── STAGES + FILES ── */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Project Stages & Files</h3>
                    {loadingDetail ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
                    ) : (
                      <div className="space-y-3">
                        {stages.map((stage) => {
                          const stageFiles = clientFiles.filter((f) => f.stage_id === stage.id);
                          const isUploading = uploadingStageId === stage.id;
                          return (
                            <div key={stage.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                              {/* Stage header */}
                              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? "#94a3b8" }} />
                                  <span className="text-sm font-semibold text-slate-700">{stage.name}</span>
                                  {stageFiles.length > 0 && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs text-slate-500">{stageFiles.length}</span>}
                                </div>
                                <button
                                  onClick={() => triggerUpload(stage.id)}
                                  disabled={isUploading}
                                  className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50"
                                >
                                  {isUploading ? (
                                    <span className="h-3.5 w-3.5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                                  ) : (
                                    <Upload className="h-3 w-3" />
                                  )}
                                  {isUploading ? "Uploading..." : "Upload File"}
                                </button>
                              </div>

                              {/* Files grid */}
                              {stageFiles.length > 0 && (
                                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {stageFiles.map((fa) => {
                                    const isImage = fa.file?.mime_type?.startsWith("image/");
                                    return (
                                      <div key={fa.id} className="group relative rounded-lg bg-white border border-slate-100 overflow-hidden">
                                        {isImage ? (
                                          <div className="aspect-video bg-slate-100">
                                            <img src={fa.file!.public_url} alt={fa.client_title} className="h-full w-full object-cover" />
                                          </div>
                                        ) : (
                                          <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                          </div>
                                        )}
                                        <div className="px-2 py-1.5">
                                          <p className="text-xs font-medium text-slate-700 truncate">{fa.client_title}</p>
                                          {fa.file?.size && <p className="text-xs text-slate-400">{formatSize(fa.file.size)}</p>}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                          {fa.can_download && fa.file && (
                                            <a href={fa.file.public_url} download target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
                                              <Download className="h-4 w-4" />
                                            </a>
                                          )}
                                          <button onClick={() => removeFileAssignment(fa.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-white hover:bg-red-500/80 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {stageFiles.length === 0 && !isUploading && (
                                <div className="px-4 py-3 text-xs text-slate-400">No files for this stage</div>
                              )}
                            </div>
                          );
                        })}

                        {/* Unassigned files */}
                        {(() => {
                          const unassigned = clientFiles.filter((f) => !f.stage_id);
                          if (unassigned.length === 0) return null;
                          return (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 shrink-0" />
                                <span className="text-sm font-semibold text-slate-500">General / Unassigned</span>
                                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs text-slate-500">{unassigned.length}</span>
                              </div>
                              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {unassigned.map((fa) => {
                                  const isImage = fa.file?.mime_type?.startsWith("image/");
                                  return (
                                    <div key={fa.id} className="group relative rounded-lg bg-white border border-slate-100 overflow-hidden">
                                      {isImage ? (
                                        <div className="aspect-video bg-slate-100">
                                          <img src={fa.file!.public_url} alt={fa.client_title} className="h-full w-full object-cover" />
                                        </div>
                                      ) : (
                                        <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                          <FileText className="h-8 w-8 text-slate-300" />
                                        </div>
                                      )}
                                      <div className="px-2 py-1.5">
                                        <p className="text-xs font-medium text-slate-700 truncate">{fa.client_title}</p>
                                        {fa.file?.size && <p className="text-xs text-slate-400">{formatSize(fa.file.size)}</p>}
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                        {fa.can_download && fa.file && (
                                          <a href={fa.file.public_url} download target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
                                            <Download className="h-4 w-4" />
                                          </a>
                                        )}
                                        <button onClick={() => removeFileAssignment(fa.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-white hover:bg-red-500/80 transition-colors">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* ── BLUEPRINTS ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Blueprint Links {!loadingDetail && `(${clientBlueprints.length})`}
                      </h3>
                      <button
                        onClick={() => setShowBpForm((v) => !v)}
                        className={cn("text-xs font-semibold rounded-lg px-2.5 py-1 transition-colors", showBpForm ? "bg-brand-primary text-white" : "text-brand-primary hover:bg-brand-primary/10")}
                      >
                        {showBpForm ? "Cancel" : "+ Add Blueprint"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showBpForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                          <div className="rounded-xl border border-brand-primary/20 bg-orange-50/50 p-4 space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Blueprint Link</p>
                            <Input value={bpForm.title} onChange={(e) => setBpForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title *" className="h-9" />
                            <Input value={bpForm.url} onChange={(e) => setBpForm((p) => ({ ...p, url: e.target.value }))} placeholder="URL * (https://...)" className="h-9" />
                            <Button onClick={addBlueprint} disabled={savingBp} className="w-full">
                              {savingBp ? "Adding..." : "Add Blueprint"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loadingDetail ? (
                      <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
                    ) : clientBlueprints.length === 0 && !showBpForm ? (
                      <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                        <Link2 className="mx-auto h-6 w-6 text-slate-300 mb-1.5" />
                        <p className="text-xs text-slate-400">No blueprints added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {clientBlueprints.map((ba) => (
                          <div key={ba.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 group">
                            <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800">{ba.blueprint?.title ?? "—"}</div>
                              {ba.blueprint?.url && (
                                <a href={ba.blueprint.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate">
                                  <ExternalLink className="h-3 w-3 shrink-0" />{ba.blueprint.url}
                                </a>
                              )}
                            </div>
                            <button onClick={() => removeBlueprint(ba.id)} className="grid h-7 w-7 place-items-center rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
                    Added {new Date(viewClient.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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

                {/* Portal Access */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Portal Access</span>
                    {editClient?.auth_user_id && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {editClient?.auth_user_id ? "Enter new credentials to update portal login." : "Set login credentials so this client can access their portal."}
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Portal Email</label>
                    <Input type="email" value={portalEmail} onChange={(e) => setPortalEmail(e.target.value)} placeholder={form.email || "client@example.com"} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                    <div className="relative">
                      <Input type={showPortalPassword ? "text" : "password"} value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} placeholder="Min 8 characters" className="h-9 text-sm pr-10" />
                      <button type="button" onClick={() => setShowPortalPassword((v) => !v)} className="absolute right-3 top-2 text-slate-400 hover:text-slate-600">
                        {showPortalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
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
              <p className="mt-2 text-sm text-slate-600">This will permanently delete <strong>{deleteTarget.name}</strong> and all associated data.</p>
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
