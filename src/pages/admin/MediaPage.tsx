import { MediaLibraryPanel } from "@/components/media/MediaPicker";

export function MediaPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Media Library</h1>
        <p className="text-sm text-slate-500">Upload, preview, and manage website images and videos from one place.</p>
      </div>
      <MediaLibraryPanel />
    </div>
  );
}
