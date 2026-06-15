import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTable, useTableMutations } from "@/hooks/useSupabaseTable";
import { removeStoredFile, uploadFile } from "@/services/crud";
import type { TableRow } from "@/types/database";

type MediaAsset = TableRow<"media_assets">;

export function MediaPicker({ value, onChange, label = "Image" }: { value?: string; onChange: (url: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input readOnly value={value ?? ""} placeholder={`${label} URL`} />
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}><ImagePlus className="h-4 w-4" /> Media</Button>
      </div>
      {value && <img src={value} alt="" className="h-24 w-40 rounded-md object-cover" />}
      {open && <MediaLibraryModal onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} />}
    </div>
  );
}

function MediaLibraryContent({ onClose, onSelect, embedded = false }: { onClose?: () => void; onSelect?: (url: string) => void; embedded?: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data = [], refetch } = useTable("media_assets", { orderBy: "created_at" });
  const { create, remove } = useTableMutations("media_assets");

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
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function deleteAsset(asset: MediaAsset) {
    await removeStoredFile(asset.bucket, asset.path);
    await remove.mutateAsync(asset.id);
    await refetch();
  }

  return (
      <Card className={embedded ? "p-0" : "max-h-[88vh] w-full max-w-5xl overflow-hidden p-0"}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-black">Media Library</h2>
            <p className="text-sm text-slate-500">Upload, select, or delete website media.</p>
          </div>
          {onClose && <Button type="button" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files)} />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Image</Button>
          <span className="text-sm text-slate-500">Images are stored in Supabase Storage bucket `website`.</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {data.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(data as MediaAsset[]).map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <button type="button" className="block aspect-[4/3] w-full bg-slate-100" onClick={() => onSelect?.(asset.url)}>
                    <img src={asset.url} alt={asset.alt_text ?? asset.file_name} className="h-full w-full object-cover" />
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

export function MediaLibraryModal({ onClose, onSelect }: { onClose: () => void; onSelect?: (url: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
      <MediaLibraryContent onClose={onClose} onSelect={onSelect} />
    </div>
  );
}

export function MediaLibraryPanel() {
  return <MediaLibraryContent embedded />;
}
