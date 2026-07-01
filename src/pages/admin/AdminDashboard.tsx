import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, Bookmark, Building2, CheckCircle2, CircleAlert,
  Clock, FileCheck, Files, FolderOpen, Gauge, LayoutGrid, Plus, TrendingUp,
  Upload, Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Stats = {
  totalClients: number;
  activeClients: number;
  completedProjects: number;
  totalProjects: number;
  totalPortfolio: number;
  publishedPortfolio: number;
  totalFolders: number;
  totalFiles: number;
  assignedFiles: number;
  unassignedFiles: number;
};

type RecentClient = { id: string; name: string; status: string; updated_at: string };
type RecentFile = { id: string; display_name: string; mime_type: string | null; created_at: string; size: number | null };

const statusColor: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "On Hold": "bg-amber-50 text-amber-700 ring-amber-200",
  Completed: "bg-blue-50 text-blue-700 ring-blue-200",
  Inactive: "bg-slate-100 text-slate-500 ring-slate-200",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-xl hover:shadow-slate-200/70"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl", tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary" />
      </div>
      <div className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 font-semibold text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-400">{detail}</div>
    </button>
  );
}

function ActionCard({ label, caption, icon: Icon, tone, action }: { label: string; caption: string; icon: LucideIcon; tone: string; action: () => void }) {
  return (
    <button onClick={action} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-brand-primary/30 hover:shadow-md">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-900">{label}</span>
        <span className="block truncate text-xs text-slate-400">{caption}</span>
      </span>
    </button>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeClients: 0,
    completedProjects: 0,
    totalProjects: 0,
    totalPortfolio: 0,
    publishedPortfolio: 0,
    totalFolders: 0,
    totalFiles: 0,
    assignedFiles: 0,
    unassignedFiles: 0,
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("id,status", { count: "exact", head: false }),
      supabase.from("client_projects").select("id,status", { count: "exact", head: false }),
      supabase.from("portfolio_projects").select("id,status", { count: "exact", head: false }),
      supabase.from("folders").select("id", { count: "exact", head: true }),
      supabase.from("files").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("client_file_assignments").select("file_id", { count: "exact", head: false }),
      supabase.from("clients").select("id,name,status,updated_at").order("updated_at", { ascending: false }).limit(6),
      supabase.from("files").select("id,display_name,mime_type,created_at,size").is("deleted_at", null).order("created_at", { ascending: false }).limit(6),
    ]).then(([clients, projects, portfolio, folders, files, assignments, recentClientsRes, recentFilesRes]) => {
      const clientRows = clients.data ?? [];
      const projectRows = projects.data ?? [];
      const portfolioRows = portfolio.data ?? [];
      const assignedFileIds = new Set((assignments.data ?? []).map((a: { file_id: string }) => a.file_id));

      setStats({
        totalClients: clientRows.length,
        activeClients: clientRows.filter((c: { status: string }) => c.status === "Active").length,
        completedProjects: projectRows.filter((p: { status: string }) => p.status === "Completed").length,
        totalProjects: projectRows.length,
        totalPortfolio: portfolioRows.length,
        publishedPortfolio: portfolioRows.filter((p: { status: string }) => p.status === "published").length,
        totalFolders: folders.count ?? 0,
        totalFiles: files.count ?? 0,
        assignedFiles: assignedFileIds.size,
        unassignedFiles: Math.max(0, (files.count ?? 0) - assignedFileIds.size),
      });
      setRecentClients((recentClientsRes.data ?? []) as RecentClient[]);
      setRecentFiles((recentFilesRes.data ?? []) as RecentFile[]);
      setLoading(false);
    });
  }, []);

  const projectCompletion = stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0;
  const fileAssignmentRate = stats.totalFiles ? Math.round((stats.assignedFiles / stats.totalFiles) * 100) : 0;
  const portfolioPublishRate = stats.totalPortfolio ? Math.round((stats.publishedPortfolio / stats.totalPortfolio) * 100) : 0;

  const statCards = [
    { label: "Clients", value: stats.totalClients, detail: `${stats.activeClients} active accounts`, icon: Users, tone: "bg-blue-50 text-blue-600", path: "/app/clients" },
    { label: "Project Delivery", value: `${projectCompletion}%`, detail: `${stats.completedProjects}/${stats.totalProjects} completed`, icon: TrendingUp, tone: "bg-emerald-50 text-emerald-600", path: "/app/clients" },
    { label: "Files", value: stats.totalFiles, detail: `${stats.assignedFiles} assigned to clients`, icon: Files, tone: "bg-violet-50 text-violet-600", path: "/app/files" },
    { label: "Portfolio", value: stats.totalPortfolio, detail: `${stats.publishedPortfolio} published projects`, icon: LayoutGrid, tone: "bg-amber-50 text-amber-600", path: "/app/portfolio" },
  ];

  const quickActions = [
    { label: "Add Client", caption: "Create client profile", icon: Users, tone: "bg-blue-50 text-blue-600", action: () => navigate("/app/clients?new=1") },
    { label: "Upload Files", caption: "Add project documents", icon: Upload, tone: "bg-violet-50 text-violet-600", action: () => navigate("/app/files?upload=1") },
    { label: "Assign File", caption: "Share to client stage", icon: FileCheck, tone: "bg-emerald-50 text-emerald-600", action: () => navigate("/app/assignments?new=1") },
    { label: "Add Portfolio", caption: "Publish project case", icon: Building2, tone: "bg-orange-50 text-orange-600", action: () => navigate("/app/portfolio?new=1") },
    { label: "Create Stage", caption: "Manage workflow", icon: Gauge, tone: "bg-cyan-50 text-cyan-600", action: () => navigate("/app/stages?new=1") },
    { label: "Add Blueprint", caption: "Attach drawings link", icon: Bookmark, tone: "bg-indigo-50 text-indigo-600", action: () => navigate("/app/blueprints?new=1") },
  ];

  const healthItems = [
    { label: "File assignment coverage", value: fileAssignmentRate, caption: `${stats.unassignedFiles} files waiting`, icon: FileCheck, tone: "text-emerald-600" },
    { label: "Published portfolio", value: portfolioPublishRate, caption: `${stats.publishedPortfolio} live entries`, icon: CheckCircle2, tone: "text-blue-600" },
    { label: "Project completion", value: projectCompletion, caption: `${stats.totalProjects} tracked projects`, icon: Activity, tone: "text-brand-primary" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative grid gap-6 p-5 md:grid-cols-[1.5fr_1fr] md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(248,106,13,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_35%)] md:block" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <Activity className="h-3.5 w-3.5 text-brand-primary" /> Operations overview
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track clients, shared documents, portfolio publishing, and delivery health from one control surface.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => navigate("/app/clients?new=1")}><Plus className="h-4 w-4" /> Add Client</Button>
              <Button variant="secondary" onClick={() => navigate("/app/files?upload=1")}><Upload className="h-4 w-4" /> Upload Files</Button>
            </div>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {healthItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <item.icon className={cn("h-4 w-4", item.tone)} /> {item.label}
                  </div>
                  <span className="text-sm font-black text-slate-950">{item.value}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${item.value}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} onClick={() => navigate(card.path)} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-950">Quick Actions</h2>
              <p className="text-xs text-slate-400">Common admin workflows</p>
            </div>
            <CircleAlert className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => <ActionCard key={action.label} {...action} />)}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-950">Document Flow</h2>
              <p className="text-xs text-slate-400">Assignment status across uploaded files</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/app/assignments")} className="text-xs text-brand-primary">Manage</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Folders", value: stats.totalFolders, icon: FolderOpen, tone: "bg-amber-50 text-amber-600" },
              { label: "Assigned", value: stats.assignedFiles, icon: FileCheck, tone: "bg-emerald-50 text-emerald-600" },
              { label: "Waiting", value: stats.unassignedFiles, icon: Clock, tone: "bg-orange-50 text-orange-600" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <div className={cn("mb-4 grid h-10 w-10 place-items-center rounded-xl", item.tone)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-slate-950">{item.value}</div>
                <div className="text-xs font-semibold text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-800">Assignment coverage</span>
              <span className="font-black text-brand-primary">{fileAssignmentRate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent" style={{ width: `${fileAssignmentRate}%` }} />
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-950">Recently Updated Clients</h2>
              <p className="text-xs text-slate-400">Latest client account activity</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/app/clients")} className="text-xs text-brand-primary">View all</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentClients.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No clients yet.</div>
            ) : recentClients.map((client) => (
              <button key={client.id} onClick={() => navigate(`/app/clients/${client.id}`)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-sm font-black text-brand-primary">
                  {client.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-900">{client.name}</div>
                  <div className="text-xs text-slate-400">{new Date(client.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1", statusColor[client.status] ?? "bg-slate-100 text-slate-500 ring-slate-200")}>{client.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-950">Recently Uploaded Files</h2>
              <p className="text-xs text-slate-400">Newest documents in storage</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/app/files")} className="text-xs text-brand-primary">View all</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentFiles.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No files yet.</div>
            ) : recentFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-4 px-5 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <Files className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900">{file.display_name}</div>
                  <div className="text-xs text-slate-400">{formatBytes(file.size)} · {new Date(file.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                </div>
                <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 sm:inline">{file.mime_type?.split("/")[1] ?? "file"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
