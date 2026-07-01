import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Download, File, FileText, FolderOpen, FolderPlus, Grid3X3,
  List, MoreVertical, MoveRight, Pencil, Plus, Search, Trash2, Upload, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { attachStoredFileAccessUrls } from "@/lib/fileUrls";
import type { TableRow } from "@/types/database";

type Folder = TableRow<"folders">;
type FileRecord = TableRow<"files"> & { preview_url?: string; download_url?: string };

const ACCEPTED = "*";

function fileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-8 w-8 text-slate-400" />;
  if (mimeType.startsWith("image/")) return <span className="text-3xl">🖼️</span>;
  if (mimeType === "application/pdf") return <span className="text-3xl">📑</span>;
  if (mimeType.includes("word")) return <span className="text-3xl">📝</span>;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return <span className="text-3xl">📊</span>;
  if (mimeType.startsWith("video/")) return <span className="text-3xl">🎬</span>;
  if (mimeType.startsWith("audio/")) return <span className="text-3xl">🎵</span>;
  return <span className="text-3xl">📄</span>;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function previewUrl(file: FileRecord) {
  return file.preview_url || file.public_url;
}

function downloadUrl(file: FileRecord) {
  return file.download_url || previewUrl(file);
}

export function FilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { profile } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileRecord | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | "bulk" | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    const folderId = currentFolder?.id ?? null;
    const foldersQuery = folderId
      ? supabase.from("folders").select("*").eq("parent_id", folderId).order("name")
      : supabase.from("folders").select("*").is("parent_id", null).order("name");
    const filesQuery = folderId
      ? supabase.from("files").select("*").eq("folder_id", folderId).is("deleted_at", null).order("created_at", { ascending: false })
      : supabase.from("files").select("*").is("folder_id", null).is("deleted_at", null).order("created_at", { ascending: false });
    const [foldersRes, filesRes] = await Promise.all([foldersQuery, filesQuery]);
    setFolders((foldersRes.data as Folder[]) ?? []);
    setFiles(await attachStoredFileAccessUrls((filesRes.data as FileRecord[]) ?? []));
    setLoading(false);
    setSelected(new Set());
  }, [currentFolder]);

  useEffect(() => { loadContent(); }, [loadContent]);

  useEffect(() => {
    if (searchParams.get("newFolder") === "1") { setShowNewFolder(true); setSearchParams({}); }
    if (searchParams.get("upload") === "1") { fileInputRef.current?.click(); setSearchParams({}); }
  }, [searchParams, setSearchParams]);

  async function createFolder() {
    if (!newFolderName.trim()) return;
    const path = currentFolder ? `${currentFolder.path}${currentFolder.name}/` : "/";
    const { error } = await supabase.from("folders").insert({ name: newFolderName.trim(), parent_id: currentFolder?.id ?? null, path, created_by: profile?.id });
    if (error) { toast.error("Error", error.message); return; }
    setNewFolderName("");
    setShowNewFolder(false);
    toast.success("Folder created");
    loadContent();
  }

  async function uploadFiles(fileList: FileList) {
    if (!fileList.length) return;
    setUploading(true);
    let done = 0;
    for (const file of Array.from(fileList)) {
      const path = `${currentFolder ? currentFolder.id + "/" : ""}${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (uploadError) {
        toast.error("Upload failed", `${file.name}: ${uploadError.message}`);
      } else {
        const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(uploadData.path);
        await supabase.from("files").insert({
          folder_id: currentFolder?.id ?? null, original_name: file.name, display_name: file.name,
          storage_path: uploadData.path, public_url: publicUrl, mime_type: file.type, size: file.size,
          bucket: "documents", created_by: profile?.id,
        });
        done++;
      }
      setUploadProgress(Math.round(((done) / fileList.length) * 100));
    }
    setUploading(false);
    setUploadProgress(0);
    toast.success(`${done} file${done !== 1 ? "s" : ""} uploaded`);
    loadContent();
  }

  async function renameFile() {
    if (!renameTarget || !renameName.trim()) return;
    await supabase.from("files").update({ display_name: renameName.trim(), updated_by: profile?.id }).eq("id", renameTarget.id);
    toast.success("File renamed");
    setRenameTarget(null);
    loadContent();
  }

  async function deleteFiles(ids: string[]) {
    for (const id of ids) {
      await supabase.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    }
    toast.success(`${ids.length} file${ids.length !== 1 ? "s" : ""} deleted`);
    setDeleteTarget(null);
    setSelected(new Set());
    loadContent();
  }

  async function deleteFolder(folder: Folder) {
    const { count } = await supabase.from("files").select("id", { count: "exact", head: true }).eq("folder_id", folder.id).is("deleted_at", null);
    if (count && count > 0) {
      toast.error("Folder not empty", `Delete the ${count} file${count > 1 ? "s" : ""} inside first.`);
      return;
    }
    await supabase.from("folders").delete().eq("id", folder.id);
    toast.success("Folder deleted");
    loadContent();
  }

  function navigateToFolder(folder: Folder | null) {
    if (folder === null) { setBreadcrumb([]); setCurrentFolder(null); return; }
    const idx = breadcrumb.findIndex((b) => b.id === folder.id);
    if (idx >= 0) setBreadcrumb(breadcrumb.slice(0, idx + 1));
    else setBreadcrumb([...breadcrumb, folder]);
    setCurrentFolder(folder);
  }

  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = files.filter((f) => f.display_name.toLowerCase().includes(search.toLowerCase()));

  const allIds = filteredFiles.map((f) => f.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleSelect(id: string) { setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(allIds)); }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Files</h1>
          <p className="text-sm text-slate-500">{files.length} file{files.length !== 1 ? "s" : ""} in {folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowNewFolder(true)}><FolderPlus className="h-4 w-4" /> New Folder</Button>
          <Button onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload</Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button onClick={() => navigateToFolder(null)} className={cn("font-medium hover:text-brand-primary transition-colors", !currentFolder ? "text-brand-primary" : "text-slate-500")}>Root</button>
        {breadcrumb.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <button onClick={() => navigateToFolder(b)} className={cn("font-medium hover:text-brand-primary transition-colors", currentFolder?.id === b.id ? "text-brand-primary" : "text-slate-500")}>{b.name}</button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="ml-auto flex gap-1.5 rounded-lg border border-slate-200 bg-white p-1">
          <button onClick={() => setViewMode("grid")} className={cn("rounded p-1.5 transition-colors", viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}><Grid3X3 className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("list")} className={cn("rounded p-1.5 transition-colors", viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setDeleteTarget("bulk")} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-700 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              <button onClick={() => setSelected(new Set())} className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"><X className="h-4 w-4" /> Clear</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Inline */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <FolderOpen className="h-5 w-5 text-amber-500" />
              <Input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setShowNewFolder(false); }} placeholder="Folder name" className="flex-1 h-8 border-0 p-0 focus:ring-0 shadow-none" />
              <Button onClick={createFolder} className="h-8 text-xs px-3">Create</Button>
              <button onClick={() => setShowNewFolder(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-blue-700">
            <span>Uploading files...</span><span>{uploadProgress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-blue-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} /></div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "space-y-2")}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className={cn("animate-pulse rounded-xl bg-slate-200", viewMode === "grid" ? "h-36" : "h-14")} />)}
        </div>
      ) : (
        <>
          {/* Folders */}
          {filteredFolders.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Folders</p>
              <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "space-y-2")}>
                {filteredFolders.map((folder) => (
                  <div key={folder.id} className={cn("group relative", viewMode === "grid" ? "rounded-xl border border-slate-200 bg-white p-4 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all" : "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 cursor-pointer")} onClick={() => navigateToFolder(folder)}>
                    <FolderOpen className={cn("shrink-0 text-amber-500", viewMode === "grid" ? "h-8 w-8 mb-2" : "h-5 w-5")} />
                    <span className={cn("font-medium text-slate-800 truncate", viewMode === "grid" ? "text-sm block" : "flex-1 text-sm")}>{folder.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder); }} className="absolute right-2 top-2 hidden h-7 w-7 place-items-center rounded-lg text-red-400 hover:bg-red-50 group-hover:grid transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {filteredFiles.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Files</p>
                {viewMode === "list" && (
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand-primary" />
                    Select all
                  </label>
                )}
              </div>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredFiles.map((file) => (
                    <div key={file.id} className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-brand-primary/40 hover:shadow-md transition-all cursor-pointer" onClick={() => setPreviewFile(file)}>
                      <label className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(file.id)} onChange={() => toggleSelect(file.id)} className="accent-brand-primary" />
                      </label>
                      <div className="flex h-28 items-center justify-center bg-slate-50">
                        {file.mime_type?.startsWith("image/") ? (
                          <img src={previewUrl(file)} alt={file.display_name} className="h-full w-full object-cover" />
                        ) : (
                          fileIcon(file.mime_type)
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-medium text-slate-800">{file.display_name}</p>
                        <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === file.id ? null : file.id); }} className="absolute right-1.5 top-1.5 hidden h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-500 shadow hover:bg-white group-hover:grid">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      {showMenu === file.id && (
                        <div className="absolute right-1.5 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
                          {[
                            { label: "Rename", icon: Pencil, action: () => { setRenameTarget(file); setRenameName(file.display_name); setShowMenu(null); } },
                            { label: "Download", icon: Download, action: () => { window.open(downloadUrl(file), "_blank"); setShowMenu(null); } },
                            { label: "Delete", icon: Trash2, danger: true, action: () => { setDeleteTarget(file); setShowMenu(null); } },
                          ].map((item) => (
                            <button key={item.label} onClick={item.action} className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50", item.danger ? "text-red-600" : "text-slate-700")}>
                              <item.icon className="h-3.5 w-3.5" />{item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand-primary" /></th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Name</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 md:table-cell">Type</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 sm:table-cell">Size</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 lg:table-cell">Date</th>
                        <th className="w-24 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPreviewFile(file)}>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(file.id)} onChange={() => toggleSelect(file.id)} className="accent-brand-primary" /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="text-xl shrink-0">{file.mime_type?.startsWith("image/") ? "🖼️" : file.mime_type === "application/pdf" ? "📑" : "📄"}</div>
                              <span className="font-medium text-slate-800 truncate max-w-xs">{file.display_name}</span>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{file.mime_type ?? "—"}</td>
                          <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{formatBytes(file.size)}</td>
                          <td className="hidden px-4 py-3 text-slate-400 text-xs lg:table-cell">{new Date(file.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setRenameTarget(file); setRenameName(file.display_name); }} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" /></button>
                              <a href={downloadUrl(file)} download={file.display_name} target="_blank" rel="noopener noreferrer" className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100"><Download className="h-3.5 w-3.5" /></a>
                              <button onClick={() => setDeleteTarget(file)} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className="py-20 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="font-semibold text-slate-600">{search ? "Nothing matches your search" : "This folder is empty"}</p>
              {!search && <div className="mt-4 flex justify-center gap-3"><Button variant="secondary" onClick={() => setShowNewFolder(true)}><FolderPlus className="h-4 w-4" /> New Folder</Button><Button onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload Files</Button></div>}
            </div>
          )}
        </>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple accept={ACCEPTED} className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4" onClick={() => setPreviewFile(null)}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="font-bold">{previewFile.display_name}</div>
                  <div className="text-xs text-slate-400">{previewFile.mime_type} · {formatBytes(previewFile.size)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={downloadUrl(previewFile)} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><Download className="h-4 w-4" /> Download</a>
                  <button onClick={() => setPreviewFile(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex max-h-[70vh] items-center justify-center overflow-hidden bg-slate-950 p-4">
                {previewFile.mime_type?.startsWith("image/") ? (
                  <img src={previewUrl(previewFile)} alt={previewFile.display_name} className="max-h-full max-w-full object-contain" />
                ) : previewFile.mime_type === "application/pdf" ? (
                  <iframe src={previewUrl(previewFile)} className="h-[65vh] w-full" title={previewFile.display_name} />
                ) : previewFile.mime_type?.startsWith("video/") ? (
                  <video src={previewUrl(previewFile)} controls className="max-h-full max-w-full" />
                ) : previewFile.mime_type?.startsWith("audio/") ? (
                  <audio src={previewUrl(previewFile)} controls />
                ) : (
                  <div className="text-center text-white">
                    <div className="mb-4 text-6xl">{fileIcon(previewFile.mime_type)}</div>
                    <p className="text-slate-300">{previewFile.display_name}</p>
                    <a href={downloadUrl(previewFile)} download target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"><Download className="h-4 w-4" /> Download File</a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {renameTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-3">Rename File</h3>
              <Input autoFocus value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && renameFile()} placeholder="New file name" />
              <div className="mt-4 flex gap-3"><Button onClick={renameFile} className="flex-1">Rename</Button><Button variant="secondary" onClick={() => setRenameTarget(null)}>Cancel</Button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-bold text-lg text-red-700">Delete {deleteTarget === "bulk" ? `${selected.size} files` : "File"}?</h3>
              <p className="mt-2 text-sm text-slate-600">{deleteTarget === "bulk" ? `Delete ${selected.size} selected file${selected.size !== 1 ? "s" : ""}?` : `Delete "${(deleteTarget as FileRecord).display_name}"?`} This action cannot be undone.</p>
              <div className="mt-5 flex gap-3">
                <Button variant="danger" className="flex-1" onClick={() => deleteFiles(deleteTarget === "bulk" ? [...selected] : [(deleteTarget as FileRecord).id])}>Delete</Button>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
