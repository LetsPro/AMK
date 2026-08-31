import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";
import { removeStoredFile, uploadFile } from "@/services/crud";
import type { TableRow } from "@/types/database";
import { useToast } from "@/contexts/ToastContext";

type MediaAsset = TableRow<"media_assets">;
type MediaKind = "image" | "video";
type MediaFilter = "all" | MediaKind;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function uploadErrorMessage(error: unknown, file: File) {
  const message = error instanceof Error ? error.message : "Could not upload media";
  if (/maximum allowed size|file size|too large|413/i.test(message)) {
    return `${file.name} is ${formatFileSize(file.size)}. Supabase rejected it because the project or website bucket limit is lower. Raise both Storage limits or use a smaller video.`;
  }
  return message;
}

export function MediaPicker({ value, onChange, label = "Image", mediaType = "image" }: { value?: string; onChange: (url: string) => void; label?: string; mediaType?: MediaKind }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}><ImagePlus className="h-4 w-4" /> {value ? `Replace ${label}` : `Choose ${label}`}</Button>
        {value && <Button type="button" variant="ghost" onClick={() => onChange("")}><Trash2 className="h-4 w-4" /> Remove</Button>}
        <span className={`text-xs font-semibold ${value ? "text-emerald-700" : "text-slate-500"}`}>{value ? `${mediaType === "video" ? "Video" : "Image"} selected` : `No ${mediaType} selected`}</span>
      </div>
      {value && (mediaType === "video"
        ? <video src={value} controls preload="metadata" className="h-28 w-48 rounded-md bg-slate-950 object-cover" />
        : <img src={value} alt={`${label} preview`} loading="lazy" decoding="async" className="h-24 w-40 rounded-md object-cover" />)}
      {open && <MediaLibraryModal mediaType={mediaType} onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} />}
    </div>
  );
}

function MediaLibraryContent({ onClose, onSelect, embedded = false, mediaType }: { onClose?: () => void; onSelect?: (url: string) => void; embedded?: boolean; mediaType?: MediaKind }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [filter, setFilter] = useState<MediaFilter>(mediaType ?? "all");
  const { data = [], refetch } = useTable("media_assets", { orderBy: "created_at" });
  const { create, remove } = useTableMutations("media_assets", { toast: false });
  const toast = useToast();
  const activeMediaType = mediaType ?? (filter === "all" ? undefined : filter);
  const visibleAssets = (data as MediaAsset[]).filter((asset) => !activeMediaType || (asset.mime_type ?? "").startsWith(`${activeMediaType}/`));

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `media/${Date.now()}-${cleanName}`;
      const url = await uploadFile("website", path, file, { onProgress: setUploadProgress });
      await create.mutateAsync({ bucket: "website", path, url, file_name: file.name, mime_type: file.type, size: file.size });
      await refetch();
      toast.success(`${file.type.startsWith("video/") ? "Video" : "Image"} uploaded`, file.name);
    } catch (error) {
      toast.error("Upload failed", uploadErrorMessage(error, file));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function deleteAsset(asset: MediaAsset) {
    try {
      await removeStoredFile(asset.bucket, asset.path);
      await remove.mutateAsync(asset.id);
      await refetch();
      toast.success("Image deleted", asset.file_name);
    } catch (error) {
      toast.error("Delete failed", error instanceof Error ? error.message : "Could not delete image");
    }
  }

  return (
    <>
      <Card className={embedded ? "overflow-hidden p-0" : "flex h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden p-0 sm:h-[min(94dvh,980px)]"}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-xl font-black">Media Library</h2>
            <p className="text-sm text-slate-500">Upload, select, or delete website images and videos.</p>
          </div>
          {onClose && <Button type="button" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white p-4">
          {!mediaType && (
            <div role="tablist" aria-label="Filter media" className="flex rounded-lg bg-slate-100 p-1">
              {(["all", "image", "video"] as const).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${filter === item ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{item === "all" ? "All" : `${item}s`}</button>
              ))}
            </div>
          )}
          <input ref={inputRef} className="hidden" type="file" accept={activeMediaType === "video" ? "video/mp4,video/webm,video/quicktime" : activeMediaType === "image" ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"} onChange={(event) => upload(event.target.files)} />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : activeMediaType === "video" ? <Film className="h-4 w-4" /> : <Upload className="h-4 w-4" />} {uploading ? `Uploading ${uploadProgress}%` : `Upload ${activeMediaType === "video" ? "Video" : activeMediaType === "image" ? "Image" : "Media"}`}</Button>
          <span className="text-sm text-slate-500">{activeMediaType === "video" ? "Large videos upload in resumable chunks. Supabase project and bucket limits still apply." : "The upload option stays visible while you browse the library."}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          {visibleAssets.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleAssets.map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <button type="button" className="relative block aspect-[4/3] w-full bg-slate-100" onClick={() => onSelect ? onSelect(asset.url) : setPreview(asset)}>
                    {(asset.mime_type ?? "").startsWith("video/")
                      ? <video src={asset.url} muted preload="metadata" className="h-full w-full object-cover" />
                      : <img src={asset.url} alt={asset.alt_text ?? asset.file_name} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                    <span className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{(asset.mime_type ?? "").startsWith("video/") ? "Video" : "Image"}</span>
                  </button>
                  <div className="space-y-2 p-3">
                    <div className="truncate text-sm font-semibold">{asset.file_name}</div>
                    <div className="flex gap-2">
                      <Button type="button" className="h-8 flex-1" onClick={() => onSelect ? onSelect(asset.url) : setPreview(asset)}>{onSelect ? "Select" : "View"}</Button>
                      <Button type="button" className="h-8" variant="danger" onClick={() => deleteAsset(asset)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-60 place-items-center rounded-lg border border-dashed border-slate-300 text-center">
              <div>
                <ImagePlus className="mx-auto mb-3 h-8 w-8 text-brand-primary" />
                <p className="font-semibold">No media uploaded yet</p>
                <p className="text-sm text-slate-500">Upload {activeMediaType === "video" ? "videos for testimonial playback" : activeMediaType === "image" ? "images to use in sliders, projects, gallery, and CMS content" : "images and videos for website content"}.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
      {preview && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/90 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)}>
          <div role="dialog" aria-modal="true" aria-label={`Preview ${preview.file_name}`} className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-950 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-brand-accent">{(preview.mime_type ?? "").startsWith("video/") ? "Video" : "Image"} preview</div>
                <div className="truncate font-semibold">{preview.file_name}</div>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/10" aria-label="Close media preview"><X className="h-5 w-5" /></button>
            </div>
            {(preview.mime_type ?? "").startsWith("video/")
              ? <video src={preview.url} controls autoPlay playsInline className="min-h-0 max-h-[calc(92dvh-65px)] w-full bg-black object-contain" />
              : <img src={preview.url} alt={preview.alt_text ?? preview.file_name} className="min-h-0 max-h-[calc(92dvh-65px)] w-full bg-black object-contain" />}
          </div>
        </div>
      )}
    </>
  );
}

export function MediaLibraryModal({ onClose, onSelect, mediaType }: { onClose: () => void; onSelect?: (url: string) => void; mediaType?: MediaKind }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-2 sm:p-3">
      <MediaLibraryContent onClose={onClose} onSelect={onSelect} mediaType={mediaType} />
    </div>
  );
}

export function MediaLibraryPanel() {
  return <MediaLibraryContent embedded />;
}
