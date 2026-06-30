import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, Bookmark, CheckCircle2, Clock, FileCheck, Files, FolderOpen,
  Plus, TrendingUp, Upload, Users
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Stats = {
  totalClients: number;
  activeClients: number;
  completedProjects: number;
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
  Active: "bg-emerald-100 text-emerald-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-blue-100 text-blue-700",
  Inactive: "bg-slate-100 text-slate-500",
};

function StatCard({ label, value, icon: Icon, color, onClick }: { label: string; value: number | string; icon: React.ElementType; color: string; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      className={cn("rounded-xl border border-slate-200 bg-white p-5 cursor-pointer transition-all", onClick && "hover:border-brand-primary/30")}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalClients: 0, activeClients: 0, completedProjects: 0, totalPortfolio: 0, publishedPortfolio: 0, totalFolders: 0, totalFiles: 0, assignedFiles: 0, unassignedFiles: 0 });
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
      supabase.from("clients").select("id,name,status,updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("files").select("id,display_name,mime_type,created_at,size").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
    ]).then(([clients, projects, portfolio, folders, files, assignments, recentClientsRes, recentFilesRes]) => {
      const clientRows = clients.data ?? [];
      const projectRows = projects.data ?? [];
      const portfolioRows = portfolio.data ?? [];
      const assignedFileIds = new Set((assignments.data ?? []).map((a: { file_id: string }) => a.file_id));

      setStats({
        totalClients: clientRows.length,
        activeClients: clientRows.filter((c: { status: string }) => c.status === "Active").length,
        completedProjects: projectRows.filter((p: { status: string }) => p.status === "Completed").length,
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

  const statCards = [
    { label: "Total Clients", value: stats.totalClients, icon: Users, color: "bg-blue-100 text-blue-600", path: "/app/clients" },
    { label: "Active Clients", value: stats.activeClients, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600", path: "/app/clients?status=Active" },
    { label: "Completed Projects", value: stats.completedProjects, icon: TrendingUp, color: "bg-brand-primary/10 text-brand-primary", path: "/app/clients" },
    { label: "Total Portfolio", value: stats.totalPortfolio, icon: Activity, color: "bg-purple-100 text-purple-600", path: "/app/portfolio" },
    { label: "Published Portfolio", value: stats.publishedPortfolio, icon: CheckCircle2, color: "bg-teal-100 text-teal-600", path: "/app/portfolio?status=published" },
    { label: "Total Folders", value: stats.totalFolders, icon: FolderOpen, color: "bg-amber-100 text-amber-600", path: "/app/files" },
    { label: "Total Files", value: stats.totalFiles, icon: Files, color: "bg-slate-100 text-slate-600", path: "/app/files" },
    { label: "Assigned Files", value: stats.assignedFiles, icon: FileCheck, color: "bg-green-100 text-green-600", path: "/app/assignments" },
    { label: "Awaiting Assignment", value: stats.unassignedFiles, icon: Clock, color: "bg-orange-100 text-orange-600", path: "/app/assignments" },
  ];

  const quickActions = [
    { label: "Add Client", icon: Users, color: "bg-blue-600 hover:bg-blue-700", action: () => navigate("/app/clients?new=1") },
    { label: "Add Portfolio Project", icon: Activity, color: "bg-purple-600 hover:bg-purple-700", action: () => navigate("/app/portfolio?new=1") },
    { label: "Create Folder", icon: FolderOpen, color: "bg-amber-600 hover:bg-amber-700", action: () => navigate("/app/files?newFolder=1") },
    { label: "Upload Files", icon: Upload, color: "bg-slate-700 hover:bg-slate-800", action: () => navigate("/app/files?upload=1") },
    { label: "Create Stage", icon: TrendingUp, color: "bg-teal-600 hover:bg-teal-700", action: () => navigate("/app/stages?new=1") },
    { label: "Assign File", icon: FileCheck, color: "bg-green-600 hover:bg-green-700", action: () => navigate("/app/assignments?new=1") },
    { label: "Add Blueprint", icon: Bookmark, color: "bg-indigo-600 hover:bg-indigo-700", action: () => navigate("/app/blueprints?new=1") },
  ];

  function fileIcon(mimeType: string | null) {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📑";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.startsWith("video/")) return "🎬";
    return "📄";
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4 md:grid-cols-3 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Here's your platform overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} color={card.color} onClick={() => navigate(card.path)} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className={cn("flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors", action.color)}
            >
              <Plus className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recently Updated Clients</h2>
            <Button variant="ghost" onClick={() => navigate("/app/clients")} className="text-xs text-brand-primary">View all</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentClients.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No clients yet. <button onClick={() => navigate("/app/clients?new=1")} className="text-brand-primary hover:underline">Add one</button></div>
            ) : recentClients.map((client) => (
              <button key={client.id} onClick={() => navigate(`/app/clients/${client.id}`)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {client.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900">{client.name}</div>
                  <div className="text-xs text-slate-400">{new Date(client.updated_at).toLocaleDateString()}</div>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusColor[client.status] ?? "bg-slate-100 text-slate-500")}>{client.status}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recently Uploaded Files</h2>
            <Button variant="ghost" onClick={() => navigate("/app/files")} className="text-xs text-brand-primary">View all</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentFiles.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No files yet. <button onClick={() => navigate("/app/files?upload=1")} className="text-brand-primary hover:underline">Upload files</button></div>
            ) : recentFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-lg">
                  {fileIcon(file.mime_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{file.display_name}</div>
                  <div className="text-xs text-slate-400">{formatBytes(file.size)} · {new Date(file.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
