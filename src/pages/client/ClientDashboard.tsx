import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Eye, FileText, FolderOpen, LayoutDashboard, Link2, Maximize2, ShieldCheck, X, Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { TableRow } from "@/types/database";
import { loadClientVisibleFiles, type ClientVisibleFile } from "@/services/clientVisibleFiles";

type Project = TableRow<"client_projects"> & {
  current_stage: { name: string; color: string | null } | null;
};

type Assignment = ClientVisibleFile;

function formatBytes(bytes: number | null) {
  if (!bytes) return "File";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MetricCard({ label, value, caption, icon: Icon, tone, action }: { label: string; value: number | string; caption: string; icon: LucideIcon; tone: string; action: () => void }) {
  return (
    <button onClick={action} className={cn("group relative overflow-hidden rounded-2xl p-5 text-left text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl", tone)}>
      <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-slate-950/10" />
      <div className="flex items-start justify-between">
        <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/20 ring-1 ring-white/20">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="relative h-5 w-5 text-white/65 transition-transform group-hover:translate-x-1 group-hover:text-white" />
      </div>
      <div className="relative mt-5 text-4xl font-black">{value}</div>
      <div className="relative mt-2 text-sm font-black">{label}</div>
      <div className="relative mt-1 text-xs font-medium text-white/75">{caption}</div>
    </button>
  );
}

export function ClientDashboard() {
  const { clientId, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [panoramaCount, setPanoramaCount] = useState(0);
  const [dashboardCover, setDashboardCover] = useState<string | null>(null);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const [{ data: pData }, visibleFiles, { count: pCount }, { data: clientData }] = await Promise.all([
        supabase.from("client_projects").select("*, current_stage:stages(name,color)").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
        loadClientVisibleFiles(clientId),
        supabase.from("client_panorama_assignments").select("*", { count: "exact", head: true }).eq("client_id", clientId),
        supabase.from("clients").select("dashboard_cover_image_url").eq("id", clientId).maybeSingle(),
      ]);
      setProjects((pData as unknown as Project[]) ?? []);
      setAssignments(visibleFiles);
      setPanoramaCount(pCount ?? 0);
      setDashboardCover((clientData as { dashboard_cover_image_url: string | null } | null)?.dashboard_cover_image_url ?? null);
      setLoading(false);
    })();
  }, [clientId]);

  const countMatchingFiles = (...terms: string[]) => assignments.filter((item) => {
    const text = `${item.category ?? ""} ${item.client_title ?? ""} ${item.stage?.name ?? ""}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  }).length;

  const metrics = [
    { label: "Architectural Drawings", value: countMatchingFiles("architect", "blueprint"), caption: "Plans and elevations", icon: LayoutDashboard, tone: "bg-emerald-600 hover:bg-emerald-500", action: () => navigate("/client/files?search=architectural") },
    { label: "Structural Drawings", value: countMatchingFiles("structur"), caption: "Structural documents", icon: FolderOpen, tone: "bg-blue-600 hover:bg-blue-500", action: () => navigate("/client/files?search=structural") },
    { label: "Electrical Drawings", value: countMatchingFiles("electric"), caption: "Electrical documents", icon: Zap, tone: "bg-violet-600 hover:bg-violet-500", action: () => navigate("/client/files?search=electrical") },
    { label: "360 Interiors", value: panoramaCount, caption: "Interactive interior views", icon: Eye, tone: "bg-amber-500 hover:bg-amber-400", action: () => navigate("/client/360-interiors") },
    { label: "Interior Detail Drawings", value: countMatchingFiles("interior"), caption: "Interior detailing", icon: FileText, tone: "bg-rose-600 hover:bg-rose-500", action: () => navigate("/client/files?search=interior") },
  ];
  const coverImageUrl = dashboardCover || projects[0]?.cover_image_url || null;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative p-5 md:p-6">
          {coverImageUrl ? (
            <button type="button" onClick={() => setCoverPreviewOpen(true)} className="group absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden text-left md:block" aria-label="Preview elevation image">
              <img src={coverImageUrl} alt="Project elevation" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/25 to-transparent" />
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm"><Maximize2 className="h-3.5 w-3.5" /> Preview</span>
            </button>
          ) : <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(248,106,13,0.16),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_38%)] md:block" />}
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" /> Client portal
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review shared project files, stage progress, links, and account activity in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => navigate("/client/files?search=architectural")} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-colors hover:bg-brand-primary/90">
                <LayoutDashboard className="h-4 w-4" /> View Drawings
              </button>
              <button onClick={() => navigate("/client/files")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50">
                <FolderOpen className="h-4 w-4" /> Open Files
              </button>
              {coverImageUrl && (
                <button onClick={() => setCoverPreviewOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 md:hidden">
                  <Maximize2 className="h-4 w-4" /> Preview Elevation
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div>
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
            ) : assignments.slice(0, 6).map((item) => (
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

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Files", caption: "Preview and download", icon: FileText, path: "/client/files", tone: "bg-violet-50 text-violet-600" },
          { label: "Links", caption: "Approved external links", icon: Link2, path: "/client/blueprints", tone: "bg-amber-50 text-amber-600" },
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

      {coverPreviewOpen && coverImageUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95" onClick={() => setCoverPreviewOpen(false)}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white" onClick={(event) => event.stopPropagation()}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-accent">Elevation preview</div>
              <div className="font-semibold">Client dashboard cover</div>
            </div>
            <button type="button" onClick={() => setCoverPreviewOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close elevation preview"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
            <img src={coverImageUrl} alt="Project elevation full preview" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
