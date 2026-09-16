import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, Download, Eye, FileText, FolderOpen, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { loadClientVisibleFiles, loadClientVisibleFolders, type ClientVisibleFile, type ClientVisibleFolder } from "@/services/clientVisibleFiles";

type Assignment = ClientVisibleFile;

const CATEGORY_COLORS: Record<string, string> = {
  Blueprint: "bg-blue-100 text-blue-700",
  Design: "bg-violet-100 text-violet-700",
  Report: "bg-amber-100 text-amber-700",
  Contract: "bg-slate-100 text-slate-600",
  Invoice: "bg-emerald-100 text-emerald-700",
  Other: "bg-slate-100 text-slate-500",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime: string | null) { return mime?.startsWith("image/") ?? false; }
function isPdf(mime: string | null) { return mime === "application/pdf"; }
function fileUrl(file: Assignment["file"]) { return file?.preview_url || file?.public_url || ""; }
function downloadUrl(file: Assignment["file"]) { return file?.download_url || fileUrl(file); }

export function ClientFilesPage() {
  const { clientId } = useAuth();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState<Assignment[]>([]);
  const [assignedFolders, setAssignedFolders] = useState<ClientVisibleFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [preview, setPreview] = useState<Assignment | null>(null);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      try {
        const [visibleFiles, visibleFolders] = await Promise.all([loadClientVisibleFiles(clientId), loadClientVisibleFolders(clientId)]);
        setFiles(visibleFiles);
        setAssignedFolders(visibleFolders);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const categories = [...new Set(files.filter((file) => !file.source_folder_id).map((f) => f.category).filter(Boolean))] as string[];

  const filtered = files.filter((f) => {
    const matchSearch = `${f.client_title} ${f.file?.display_name ?? ""} ${f.category ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || f.category === categoryFilter;
    return matchSearch && matchCat;
  });
  const rootFolderIds = new Set(assignedFolders.filter((folder) => folder.parent_id === null).map((folder) => folder.id));
  const childFolders = assignedFolders.filter((folder) => folder.parent_id && rootFolderIds.has(folder.parent_id));
  const folders = childFolders.length > 0 ? childFolders : assignedFolders.filter((folder) => folder.parent_id === null);
  const visibleFolders = folders.filter((folder) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return folder.name.toLowerCase().includes(term) || files.some((file) => file.source_folder_id === folder.id && `${file.client_title} ${file.file?.display_name ?? ""}`.toLowerCase().includes(term));
  });
  const displayedFiles = selectedFolder
    ? filtered.filter((file) => file.source_folder_id === selectedFolder)
    : filtered.filter((file) => !file.source_folder_id);
  const selectedFolderName = folders.find((folder) => folder.id === selectedFolder)?.name;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Files</h1>
        <p className="text-sm text-slate-500 mt-1">{folders.length} folder{folders.length !== 1 ? "s" : ""} · {files.length} file{files.length !== 1 ? "s" : ""} shared with you</p>
      </div>

      {selectedFolder && <button type="button" onClick={() => setSelectedFolder(null)} className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"><ChevronLeft className="h-4 w-4" /> All folders <span className="text-slate-300">/</span> <span className="text-slate-700">{selectedFolderName}</span></button>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCategoryFilter("")} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", !categoryFilter ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50")}>All</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", categoryFilter === c ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50")}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (!selectedFolder && visibleFolders.length === 0 && displayedFiles.length === 0) || (Boolean(selectedFolder) && displayedFiles.length === 0) ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          {selectedFolder ? <FolderOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" /> : <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />}
          <p className="text-slate-500">{selectedFolder ? "This folder is ready for files." : "No files found."}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {!selectedFolder && visibleFolders.length > 0 && <section><div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Assigned folders</div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleFolders.map((folder) => {
            const folderFiles = files.filter((file) => file.source_folder_id === folder.id);
            return <button key={folder.id} type="button" onClick={() => { setSelectedFolder(folder.id); setCategoryFilter(""); }} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500"><FolderOpen className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block truncate font-black text-slate-900">{folder.name}</span><span className="mt-1 block text-xs text-slate-400">{folderFiles.length} file{folderFiles.length !== 1 ? "s" : ""}</span></span><span className="text-xl text-slate-300 transition-transform group-hover:translate-x-0.5">›</span></button>;
          })}</div></section>}
          {displayedFiles.length > 0 && <section><div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{selectedFolder ? `${selectedFolderName} files` : "Individually shared files"}</div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {displayedFiles.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-primary/30 hover:shadow-sm transition-all">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
                {isImage(f.file?.mime_type ?? null)
                  ? <img src={fileUrl(f.file)} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-lg object-cover" />
                  : <FileText className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{f.client_title}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {f.category && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CATEGORY_COLORS[f.category] ?? "bg-slate-100 text-slate-500")}>{f.category}</span>}
                  {f.file?.size && <span className="text-xs text-slate-400">{formatSize(f.file.size)}</span>}
                  {f.stage && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.stage.color ?? "#94a3b8" }} />{f.stage.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {f.can_preview && f.file && (
                  <button onClick={() => setPreview(f)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Preview">
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {f.can_download && f.file && (
                  <a href={downloadUrl(f.file)} download target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Download">
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
          </div></section>}
        </div>
      )}

      {/* Preview Modal */}
      {preview && preview.file && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90" onClick={() => setPreview(null)}>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <span className="font-semibold text-white truncate">{preview.client_title}</span>
            <button onClick={() => setPreview(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isImage(preview.file.mime_type) ? (
              <img src={fileUrl(preview.file)} alt={preview.client_title} loading="eager" decoding="async" className="max-w-full max-h-full rounded-lg object-contain" />
            ) : isPdf(preview.file.mime_type) ? (
              <iframe src={fileUrl(preview.file)} loading="lazy" className="w-full h-full rounded-lg" title={preview.client_title} />
            ) : preview.file.mime_type?.startsWith("video/") ? (
              <video src={fileUrl(preview.file)} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg object-contain" />
            ) : preview.file.mime_type?.startsWith("audio/") ? (
              <audio src={fileUrl(preview.file)} controls autoPlay />
            ) : (
              <div className="text-center text-white">
                <FileText className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <p className="text-slate-300">Preview not available for this file type.</p>
                {preview.can_download && (
                  <a href={downloadUrl(preview.file)} download target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90">
                    <Download className="h-4 w-4" /> Download
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
