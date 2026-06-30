import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Link2, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { TableRow, StageStatus } from "@/types/database";

type Project = TableRow<"client_projects"> & {
  current_stage: { name: string; color: string | null } | null;
};
type Assignment = TableRow<"client_file_assignments">;
type Blueprint = TableRow<"client_blueprint_assignments"> & {
  blueprint: { title: string; url: string } | null;
};

const statusColor: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-blue-100 text-blue-700",
  Cancelled: "bg-red-100 text-red-700",
};

export function ClientDashboard() {
  const { clientId, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [blueprintCount, setBlueprintCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const [{ data: pData }, { count: fCount }, { count: bCount }] = await Promise.all([
        supabase.from("client_projects").select("*, current_stage:stages(name,color)").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
        supabase.from("client_file_assignments").select("*", { count: "exact", head: true }).eq("client_id", clientId),
        supabase.from("client_blueprint_assignments").select("*", { count: "exact", head: true }).eq("client_id", clientId).eq("is_visible", true),
      ]);
      setProjects((pData as Project[]) ?? []);
      setFileCount(fCount ?? 0);
      setBlueprintCount(bCount ?? 0);
      setLoading(false);
    })();
  }, [clientId]);

  const activeProjects = projects.filter((p) => p.status === "Active");
  const overallProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!</h1>
        <p className="text-sm text-slate-500 mt-1">Here's an overview of your projects and files.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "Active Projects", value: activeProjects.length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50", action: () => navigate("/client/progress") },
          { label: "Overall Progress", value: `${overallProgress}%`, icon: TrendingUp, color: "text-blue-600 bg-blue-50", action: () => navigate("/client/progress") },
          { label: "Files Shared", value: fileCount, icon: FileText, color: "text-violet-600 bg-violet-50", action: () => navigate("/client/files") },
          { label: "Blueprint Links", value: blueprintCount, icon: Link2, color: "text-amber-600 bg-amber-50", action: () => navigate("/client/blueprints") },
        ].map((stat) => (
          <button key={stat.label} onClick={stat.action} className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-brand-primary/30 hover:shadow-sm transition-all">
            <div className={cn("inline-flex items-center justify-center rounded-lg p-2 mb-3", stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-slate-900">{loading ? "—" : stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Your Projects</h2>
          <button onClick={() => navigate("/client/progress")} className="flex items-center gap-1 text-sm text-brand-primary hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No projects yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  {p.current_stage && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.current_stage.color ?? "#94a3b8" }} />
                      <span className="text-xs text-slate-500">{p.current_stage.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{p.progress}%</span>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColor[p.status] ?? "bg-slate-100 text-slate-500")}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
