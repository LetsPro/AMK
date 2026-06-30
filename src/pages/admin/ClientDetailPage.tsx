import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bookmark, CheckCircle2, ChevronDown, ChevronUp, Clock, FileText,
  Pencil, Plus, Trash2, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TableRow, ClientStatus, StageStatus, ProjectStatus } from "@/types/database";

type Client = TableRow<"clients">;
type ClientProject = TableRow<"client_projects"> & { stages?: ClientProjectStage[] };
type ClientProjectStage = TableRow<"client_project_stages"> & { stage?: TableRow<"stages"> | null };
type FileAssignment = TableRow<"client_file_assignments"> & { file?: { display_name: string; mime_type: string | null } | null };
type BlueprintAssignment = TableRow<"client_blueprint_assignments"> & { blueprint?: { title: string; url: string } | null };

const TABS = ["Overview", "Project Progress", "Assigned Files", "Blueprints", "Activity"] as const;
type Tab = typeof TABS[number];

const statusColor: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-blue-100 text-blue-700",
  Inactive: "bg-slate-100 text-slate-500",
  "Not Started": "bg-slate-100 text-slate-500",
  "In Progress": "bg-blue-100 text-blue-700",
  "Awaiting Client Approval": "bg-amber-100 text-amber-700",
  "Revision Required": "bg-red-100 text-red-700",
  Skipped: "bg-slate-100 text-slate-400",
};

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [fileAssignments, setFileAssignments] = useState<FileAssignment[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", start_date: "", expected_completion_date: "", status: "Active" as ProjectStatus });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [clientRes, projectsRes, filesRes, blueprintsRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).maybeSingle(),
      supabase.from("client_projects").select("*, stages:client_project_stages(*, stage:stages(*))").eq("client_id", id).order("created_at"),
      supabase.from("client_file_assignments").select("*, file:files(display_name,mime_type)").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("client_blueprint_assignments").select("*, blueprint:blueprint_links(title,url)").eq("client_id", id).order("created_at", { ascending: false }),
    ]);
    setClient(clientRes.data as Client | null);
    setProjects((projectsRes.data as ClientProject[]) ?? []);
    setFileAssignments((filesRes.data as FileAssignment[]) ?? []);
    setBlueprints((blueprintsRes.data as BlueprintAssignment[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function createProject() {
    if (!id || !projectForm.name.trim()) return;
    const { error } = await supabase.from("client_projects").insert({ client_id: id, ...projectForm, created_by: profile?.id });
    if (error) { toast.error("Error", error.message); return; }
    toast.success("Project created");
    setShowProjectForm(false);
    setProjectForm({ name: "", description: "", start_date: "", expected_completion_date: "", status: "Active" });
    load();
  }

  async function toggleClientStatus() {
    if (!client) return;
    const newStatus: ClientStatus = client.status === "Active" ? "Inactive" : "Active";
    await supabase.from("clients").update({ status: newStatus }).eq("id", client.id);
    setClient({ ...client, status: newStatus });
    toast.success(`Client marked as ${newStatus}`);
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>;
  if (!client) return <div className="py-20 text-center text-slate-500">Client not found. <button className="text-brand-primary hover:underline" onClick={() => navigate("/app/clients")}>Back to clients</button></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate("/app/clients")} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{client.name}</h1>
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusColor[client.status] ?? "bg-slate-100 text-slate-500")}>{client.status}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{client.email}{client.mobile ? ` · ${client.mobile}` : ""}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={toggleClientStatus}>{client.status === "Active" ? "Deactivate" : "Activate"}</Button>
          <Button onClick={() => navigate(`/app/clients?edit=${client.id}`)}><Pencil className="h-4 w-4" /> Edit</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("shrink-0 border-b-2 px-5 py-3 text-sm font-medium transition-colors", activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-800")}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-slate-800">Client Information</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Name", client.name],
                ["Contact Person", client.contact_person],
                ["Email", client.email],
                ["Phone", client.mobile],
                ["Address", client.address],
              ].map(([label, value]) => value ? (
                <div key={label} className="flex gap-2">
                  <span className="w-28 shrink-0 text-slate-400">{label}</span>
                  <span className="text-slate-800">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-slate-800">Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Projects", projects.length],
                ["Active Projects", projects.filter((p) => p.status === "Active").length],
                ["Files Assigned", fileAssignments.length],
                ["Blueprints", blueprints.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-2xl font-black text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          {client.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-bold text-slate-800">Client Notes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
            </div>
          )}
          {client.admin_notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="mb-2 font-bold text-amber-800">Internal Notes (Admin Only)</h3>
              <p className="text-sm text-amber-700 leading-relaxed">{client.admin_notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Project Progress" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">{projects.length} Project{projects.length !== 1 ? "s" : ""}</h2>
            <Button onClick={() => setShowProjectForm(true)}><Plus className="h-4 w-4" /> Add Project</Button>
          </div>

          {projects.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400">No projects yet.</p>
              <Button className="mt-4" onClick={() => setShowProjectForm(true)}><Plus className="h-4 w-4" /> Add Project</Button>
            </div>
          ) : projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{project.name}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColor[project.status] ?? "bg-slate-100")}>{project.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span><span>{project.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                {expandedProject === project.id ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
              </button>

              <AnimatePresence>
                {expandedProject === project.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-100">
                    <div className="p-5 space-y-3">
                      {project.description && <p className="text-sm text-slate-600">{project.description}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        {project.start_date && <span><strong className="text-slate-700">Start:</strong> {project.start_date}</span>}
                        {project.expected_completion_date && <span><strong className="text-slate-700">Expected:</strong> {project.expected_completion_date}</span>}
                      </div>
                      {(project.stages ?? []).length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Stages</h4>
                          {(project.stages ?? []).sort((a, b) => a.display_order - b.display_order).map((ps) => (
                            <div key={ps.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", ps.status === "Completed" ? "bg-emerald-500" : ps.status === "In Progress" ? "bg-blue-500" : ps.status === "Revision Required" ? "bg-red-500" : "bg-slate-300")} />
                              <span className="flex-1 text-sm font-medium text-slate-800">{ps.stage?.name ?? "Stage"}</span>
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColor[ps.status] ?? "bg-slate-100")}>{ps.status}</span>
                              <span className="text-xs text-slate-400">{ps.progress}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Assigned Files" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">{fileAssignments.length} Assigned File{fileAssignments.length !== 1 ? "s" : ""}</h2>
            <Button onClick={() => navigate(`/app/assignments?client=${id}`)}>
              <Plus className="h-4 w-4" /> Assign File
            </Button>
          </div>
          {fileAssignments.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-slate-300">
              <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-400">No files assigned yet.</p>
            </div>
          ) : fileAssignments.map((fa) => (
            <div key={fa.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xl">
                {fa.file?.mime_type?.startsWith("image/") ? "🖼️" : fa.file?.mime_type === "application/pdf" ? "📑" : "📄"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{fa.client_title}</div>
                {fa.client_description && <div className="text-xs text-slate-400 truncate">{fa.client_description}</div>}
                <div className="text-xs text-slate-400">{fa.file?.display_name}</div>
              </div>
              <div className="flex gap-2 text-xs text-slate-500">
                {fa.can_preview && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">Preview</span>}
                {fa.can_download && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-600">Download</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Blueprints" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">{blueprints.length} Blueprint{blueprints.length !== 1 ? "s" : ""}</h2>
            <Button onClick={() => navigate(`/app/blueprints?client=${id}`)}>
              <Plus className="h-4 w-4" /> Assign Blueprint
            </Button>
          </div>
          {blueprints.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-slate-300">
              <Bookmark className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-400">No blueprints assigned yet.</p>
            </div>
          ) : blueprints.map((ba) => (
            <div key={ba.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <Bookmark className="h-5 w-5 shrink-0 text-brand-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{ba.blueprint?.title ?? "Blueprint"}</div>
                <div className="text-xs text-slate-400 truncate">{ba.blueprint?.url}</div>
              </div>
              <a href={ba.blueprint?.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary hover:underline">Open</a>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Activity" && (
        <ActivityTab clientId={id!} />
      )}

      {/* Add Project Modal */}
      <AnimatePresence>
        {showProjectForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Add Project</h3>
                <button onClick={() => setShowProjectForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name *</label>
                  <Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="e.g. Chamundi Hill Residence" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="h-16 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input type="date" value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expected Completion</label>
                    <Input type="date" value={projectForm.expected_completion_date} onChange={(e) => setProjectForm({ ...projectForm, expected_completion_date: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button onClick={createProject} className="flex-1">Create Project</Button>
                <Button variant="secondary" onClick={() => setShowProjectForm(false)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityTab({ clientId }: { clientId: string }) {
  const [logs, setLogs] = useState<Array<{ id: string; action: string; module: string; created_at: string; metadata: unknown }>>([]);

  useEffect(() => {
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setLogs(data ?? []));
  }, [clientId]);

  if (logs.length === 0) return <div className="py-12 text-center text-slate-400">No activity recorded yet.</div>;

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800">{log.action} on {log.module}</div>
            <div className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
