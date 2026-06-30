import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { TableRow, StageStatus } from "@/types/database";

type Project = TableRow<"client_projects">;
type ProjectStage = TableRow<"client_project_stages"> & {
  stage: { name: string; color: string | null; icon: string | null } | null;
};

const STAGE_STATUS_COLOR: Record<StageStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-500",
  "In Progress": "bg-blue-100 text-blue-700",
  "Awaiting Client Approval": "bg-amber-100 text-amber-700",
  "Revision Required": "bg-red-100 text-red-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Skipped: "bg-slate-100 text-slate-400",
};

const PROJECT_STATUS_COLOR: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-blue-100 text-blue-700",
  Cancelled: "bg-red-100 text-red-700",
};

export function ClientProgressPage() {
  const { clientId } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stagesByProject, setStagesByProject] = useState<Record<string, ProjectStage[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const { data: pData } = await supabase.from("client_projects").select("*").eq("client_id", clientId).order("created_at");
      const projects = (pData as Project[]) ?? [];
      setProjects(projects);
      if (projects.length > 0) {
        const { data: sData } = await supabase.from("client_project_stages").select("*, stage:stages(name,color,icon)").in("client_project_id", projects.map((p) => p.id)).order("display_order");
        const byProject: Record<string, ProjectStage[]> = {};
        ((sData as ProjectStage[]) ?? []).forEach((s) => {
          if (!byProject[s.client_project_id]) byProject[s.client_project_id] = [];
          byProject[s.client_project_id].push(s);
        });
        setStagesByProject(byProject);
        if (projects.length === 1) setExpanded(new Set([projects[0].id]));
      }
      setLoading(false);
    })();
  }, [clientId]);

  function toggleProject(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Project Progress</h1>
        <p className="text-sm text-slate-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} in total</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-500">No projects assigned yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const stages = stagesByProject[project.id] ?? [];
            const isOpen = expanded.has(project.id);
            return (
              <div key={project.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors" onClick={() => toggleProject(project.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{project.name}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", PROJECT_STATUS_COLOR[project.status] ?? "bg-slate-100 text-slate-500")}>
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-brand-primary">{project.progress}%</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {project.description && <p className="text-sm text-slate-600 mb-4">{project.description}</p>}
                    {stages.length === 0 ? (
                      <p className="text-sm text-slate-400">No stages defined for this project.</p>
                    ) : (
                      <div className="space-y-3">
                        {stages.map((s, idx) => (
                          <div key={s.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", s.status === "Completed" ? "bg-emerald-500 text-white" : s.status === "In Progress" ? "bg-brand-primary text-white" : "bg-slate-200 text-slate-500")}>
                                {s.status === "Completed" ? "✓" : idx + 1}
                              </div>
                              {idx < stages.length - 1 && <div className="mt-1 w-0.5 h-8 bg-slate-200" />}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-800">{s.stage?.name}</span>
                                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STAGE_STATUS_COLOR[s.status])}>
                                  {s.status}
                                </span>
                              </div>
                              {s.client_notes && <p className="mt-1 text-xs text-slate-500">{s.client_notes}</p>}
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="w-32 h-1.5 rounded-full bg-slate-100">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, backgroundColor: s.stage?.color ?? "#F86A0D" }} />
                                </div>
                                <span className="text-xs text-slate-400">{s.progress}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
