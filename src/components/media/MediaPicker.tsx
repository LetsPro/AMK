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
  const { data = [], refetch } = useTable("media_assets", { orderBy: "created_at" });
  const { create, remove } = useTableMutations("media_assets", { toast: false });
  const toast = useToast();

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `media/${Date.now()}-${cleanName}`;
      const url = await uploadFile("website", path, file);
      await create.mutateAsync({ bucket: "website", path, url, file_name: file.name, mime_type: file.type, size: file.size });
      await refetch();
      toast.success(`${file.type.startsWith("video/") ? "Video" : "Image"} uploaded`, file.name);
    } catch (error) {
      toast.error("Upload failed", error instanceof Error ? error.message : "Could not upload media");
    } finally {
      setUploading(false);
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
      <Card className={embedded ? "p-0" : "flex h-[min(88vh,760px)] w-full max-w-5xl flex-col overflow-hidden p-0"}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-xl font-black">Media Library</h2>
            <p className="text-sm text-slate-500">Upload, select, or delete website images and videos.</p>
          </div>
          {onClose && <Button type="button" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white p-4">
          <input ref={inputRef} className="hidden" type="file" accept={mediaType === "video" ? "video/mp4,video/webm,video/quicktime" : mediaType === "image" ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"} onChange={(event) => upload(event.target.files)} />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : mediaType === "video" ? <Film className="h-4 w-4" /> : <Upload className="h-4 w-4" />} Upload {mediaType === "video" ? "Video" : mediaType === "image" ? "Image" : "Media"}</Button>
          <span className="text-sm text-slate-500">The upload option stays visible while you browse the library.</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          {data.filter((asset) => !mediaType || (asset.mime_type ?? "").startsWith(`${mediaType}/`)).length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(data as MediaAsset[]).filter((asset) => !mediaType || (asset.mime_type ?? "").startsWith(`${mediaType}/`)).map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <button type="button" className="block aspect-[4/3] w-full bg-slate-100" onClick={() => onSelect?.(asset.url)}>
                    {(asset.mime_type ?? "").startsWith("video/")
                      ? <video src={asset.url} muted preload="metadata" className="h-full w-full object-cover" />
                      : <img src={asset.url} alt={asset.alt_text ?? asset.file_name} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                  </button>
                  <div className="space-y-2 p-3">
                    <div className="truncate text-sm font-semibold">{asset.file_name}</div>
                    <div className="flex gap-2">
                      {onSelect && <Button type="button" className="h-8 flex-1" onClick={() => onSelect(asset.url)}>Select</Button>}
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
                <p className="text-sm text-slate-500">Upload images to use in sliders, projects, gallery, and CMS content.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
  );
}

export function MediaLibraryModal({ onClose, onSelect, mediaType }: { onClose: () => void; onSelect?: (url: string) => void; mediaType?: MediaKind }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-3 sm:p-4">
      <MediaLibraryContent onClose={onClose} onSelect={onSelect} mediaType={mediaType} />
    </div>
  );
}

export function MediaLibraryPanel() {
  return <MediaLibraryContent embedded />;
}
