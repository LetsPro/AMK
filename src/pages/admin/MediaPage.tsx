import { MediaLibraryPanel } from "@/components/media/MediaPicker";

export function MediaPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Media Library</h1>
        <p className="text-sm text-slate-500">Manage uploaded images for homepage sliders, projects, gallery, services, and other website modules.</p>
      </div>
      <MediaLibraryPanel />
    </div>
  );
}
