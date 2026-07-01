import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Bookmark, CalendarClock, CheckCircle2, FileText, FolderOpen,
  LayoutDashboard, Link2, ShieldCheck, TrendingUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { TableRow } from "@/types/database";

type Project = TableRow<"client_projects"> & {
  current_stage: { name: string; color: string | null } | null;
};

type Assignment = TableRow<"client_file_assignments"> & {
  file: { display_name: string; mime_type: string | null; size: number | null } | null;
  stage: { name: string; color: string | null } | null;
};

const statusColor: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "On Hold": "bg-amber-50 text-amber-700 ring-amber-200",
  Completed: "bg-blue-50 text-blue-700 ring-blue-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "File";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MetricCard({ label, value, caption, icon: Icon, tone, action }: { label: string; value: number | string; caption: string; icon: LucideIcon; tone: string; action: () => void }) {
  return (
    <button onClick={action} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", tone)}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary" />
      </div>
      <div className="mt-4 text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-bold text-slate-800">{label}</div>
      <div className="mt-1 text-xs text-slate-400">{caption}</div>
    </button>
  );
}

export function ClientDashboard() {
  const { clientId, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [blueprintCount, setBlueprintCount] = useState(0);
  const [stageCount, setStageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const now = new Date().toISOString();
      const [{ data: pData }, { data: fData }, { count: bCount }, { count: sCount }] = await Promise.all([
        supabase.from("client_projects").select("*, current_stage:stages(name,color)").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
        supabase
          .from("client_file_assignments")
          .select("*, file:files(display_name,mime_type,size), stage:stages(name,color)")
          .eq("client_id", clientId)
          .or(`visible_from.is.null,visible_from.lte.${now}`)
          .or(`expires_at.is.null,expires_at.gte.${now}`)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("client_blueprint_assignments").select("*", { count: "exact", head: true }).eq("client_id", clientId).eq("is_visible", true),
        supabase.from("stages").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);
      setProjects((pData as Project[]) ?? []);
      setAssignments((fData as Assignment[]) ?? []);
      setBlueprintCount(bCount ?? 0);
      setStageCount(sCount ?? 0);
      setLoading(false);
    })();
  }, [clientId]);

  const activeProjects = projects.filter((p) => p.status === "Active");
  const overallProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;
  const stagesWithFiles = useMemo(() => new Set(assignments.map((item) => item.stage_id).filter(Boolean)).size, [assignments]);

  const metrics = [
    { label: "Active Projects", value: activeProjects.length, caption: `${projects.length} total tracked`, icon: TrendingUp, tone: "bg-emerald-50 text-emerald-600", action: () => navigate("/client/progress") },
    { label: "Overall Progress", value: `${overallProgress}%`, caption: "Average project completion", icon: CheckCircle2, tone: "bg-blue-50 text-blue-600", action: () => navigate("/client/progress") },
    { label: "Shared Files", value: assignments.length, caption: `${stagesWithFiles}/${stageCount} stages with files`, icon: FileText, tone: "bg-violet-50 text-violet-600", action: () => navigate("/client/files") },
    { label: "Blueprint Links", value: blueprintCount, caption: "Approved links available", icon: Link2, tone: "bg-amber-50 text-amber-600", action: () => navigate("/client/blueprints") },
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
        <div className="relative p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(248,106,13,0.16),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_38%)] md:block" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" /> Client portal
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review shared project files, stage progress, blueprint links, and account activity in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => navigate("/client/progress")} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-colors hover:bg-brand-primary/90">
                <TrendingUp className="h-4 w-4" /> View Progress
              </button>
              <button onClick={() => navigate("/client/files")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
                <FolderOpen className="h-4 w-4" /> Open Files
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-950">Project Snapshot</h2>
              <p className="text-xs text-slate-400">Current tracked project work</p>
            </div>
            <button onClick={() => navigate("/client/progress")} className="flex items-center gap-1 text-xs font-bold text-brand-primary">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <div className="py-12 text-center">
                <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">No project records assigned yet.</p>
              </div>
            ) : projects.map((project) => (
              <div key={project.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-slate-950">{project.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {project.current_stage?.name ?? "Stage details pending"}
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1", statusColor[project.status] ?? "bg-slate-100 text-slate-500 ring-slate-200")}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs font-black text-brand-primary">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-950">Latest Shared Files</h2>
              <p className="text-xs text-slate-400">Recently visible project documents</p>
            </div>
            <button onClick={() => navigate("/client/files")} className="flex items-center gap-1 text-xs font-bold text-brand-primary">
              Files <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">No shared files yet.</p>
              </div>
            ) : assignments.map((item) => (
              <button key={item.id} onClick={() => navigate("/client/files")} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900">{item.client_title}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatBytes(item.file?.size ?? null)}</span>
                    {item.stage && (
                      <>
                        <span>·</span>
                        <span className="truncate">{item.stage.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Progress", caption: "Stage files and updates", icon: TrendingUp, path: "/client/progress", tone: "bg-emerald-50 text-emerald-600" },
          { label: "Files", caption: "Preview and download", icon: FileText, path: "/client/files", tone: "bg-violet-50 text-violet-600" },
          { label: "Blueprints", caption: "Approved external links", icon: Bookmark, path: "/client/blueprints", tone: "bg-amber-50 text-amber-600" },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-brand-primary/30 hover:shadow-md">
            <span className={cn("grid h-11 w-11 place-items-center rounded-xl", item.tone)}>
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black text-slate-950">{item.label}</span>
              <span className="block text-xs text-slate-400">{item.caption}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </section>
    </div>
  );
}

