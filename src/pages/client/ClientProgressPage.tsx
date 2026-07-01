import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { attachFileAccessUrls } from "@/lib/fileUrls";
import type { TableRow } from "@/types/database";

type Stage = TableRow<"stages">;
type Assignment = TableRow<"client_file_assignments"> & {
  file: {
    display_name: string;
    public_url: string;
    preview_url?: string;
    download_url?: string;
    mime_type: string | null;
    size: number | null;
    storage_path: string;
    bucket: string;
  } | null;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileUrl(file: Assignment["file"]) {
  return file?.preview_url || file?.public_url || "";
}

function downloadUrl(file: Assignment["file"]) {
  return file?.download_url || fileUrl(file);
}

function canInlinePreview(file: Assignment["file"]) {
  return Boolean(file?.mime_type?.startsWith("image/") || file?.mime_type === "application/pdf");
}

export function ClientProgressPage() {
  const { clientId } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [preview, setPreview] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      setLoading(true);
      const now = new Date().toISOString();
      const [{ data: stageData }, { data: fileData }] = await Promise.all([
        supabase.from("stages").select("*").eq("status", "active").order("display_order"),
        supabase
          .from("client_file_assignments")
          .select("*, file:files(display_name,public_url,mime_type,size,storage_path,bucket)")
          .eq("client_id", clientId)
          .or(`visible_from.is.null,visible_from.lte.${now}`)
          .or(`expires_at.is.null,expires_at.gte.${now}`)
          .order("display_order"),
      ]);

      setStages((stageData as Stage[]) ?? []);
      setAssignments(await attachFileAccessUrls((fileData as Assignment[]) ?? []));
      setLoading(false);
    })();
  }, [clientId]);

  const filesByStage = useMemo(() => {
    return assignments.reduce<Record<string, Assignment[]>>((acc, item) => {
      const key = item.stage_id ?? "general";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [assignments]);

  const activeStageCount = stages.filter((stage) => (filesByStage[stage.id] ?? []).length > 0).length;
  const generalFiles = filesByStage.general ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Project Progress</h1>
        <p className="mt-1 text-sm text-slate-500">
          {assignments.length} file{assignments.length !== 1 ? "s" : ""} shared across {activeStageCount} active stage{activeStageCount !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : stages.length === 0 && assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No project stages or files are available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage, index) => {
              const stageFiles = filesByStage[stage.id] ?? [];
              const hasFiles = stageFiles.length > 0;
              return (
                <section
                  key={stage.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition-all",
                    hasFiles
                      ? "border-brand-primary/30 shadow-sm shadow-orange-100"
                      : "border-slate-200 opacity-80 grayscale-[0.1]",
                  )}
                >
                  <div className={cn("flex items-center gap-3 border-b px-4 py-3", hasFiles ? "border-orange-100 bg-orange-50/60" : "border-slate-100 bg-slate-50")}>
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black",
                        hasFiles ? "bg-brand-primary text-white shadow-lg shadow-orange-200" : "bg-white text-slate-400 ring-1 ring-slate-200",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className={cn("truncate text-sm font-black", hasFiles ? "text-slate-950" : "text-slate-500")}>{stage.name}</h2>
                      <p className="text-xs text-slate-400">
                        {hasFiles ? `${stageFiles.length} uploaded file${stageFiles.length !== 1 ? "s" : ""}` : "No uploaded files"}
                      </p>
                    </div>
                    <span className={cn("h-2.5 w-2.5 rounded-full", hasFiles ? "bg-brand-primary" : "bg-slate-300")} style={hasFiles ? { backgroundColor: stage.color ?? "#F86A0D" } : undefined} />
                  </div>

                  <div className="min-h-28 p-3">
                    {hasFiles ? (
                      <div className="space-y-2">
                        {stageFiles.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                              {item.file?.mime_type?.startsWith("image/") ? (
                                <img src={fileUrl(item.file)} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">{item.client_title}</p>
                              <p className="text-xs text-slate-400">{item.file?.size ? formatSize(item.file.size) : item.file?.mime_type ?? "File"}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {item.can_preview && item.file && canInlinePreview(item.file) && (
                                <button onClick={() => setPreview(item)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {item.can_download && item.file && (
                                <a href={downloadUrl(item.file)} download target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
                        Waiting for files
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {generalFiles.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-black text-slate-900">General Files</h2>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {generalFiles.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.client_title}</p>
                      <p className="text-xs text-slate-400">{item.file?.size ? formatSize(item.file.size) : "File"}</p>
                    </div>
                    {item.can_download && item.file && (
                      <a href={downloadUrl(item.file)} download target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {preview?.file && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90" onClick={() => setPreview(null)}>
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <span className="truncate font-semibold text-white">{preview.client_title}</span>
            <button onClick={() => setPreview(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            {preview.file.mime_type?.startsWith("image/") ? (
              <img src={fileUrl(preview.file)} alt={preview.client_title} className="max-h-full max-w-full rounded-lg object-contain" />
            ) : preview.file.mime_type === "application/pdf" ? (
              <iframe src={fileUrl(preview.file)} className="h-full w-full rounded-lg bg-white" title={preview.client_title} />
            ) : (
              <div className="text-center text-white">
                <FileText className="mx-auto mb-4 h-16 w-16 text-slate-400" />
                <p className="text-slate-300">Preview is not available for this file type.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
