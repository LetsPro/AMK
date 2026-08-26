import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Maximize2, Move, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Seo } from "@/components/seo/Seo";
import { useTable } from "@/hooks/useSupabaseTable";
import type { TableRow } from "@/types/database";

type PanoramaCategory = TableRow<"panorama_categories">;
export type Panorama = TableRow<"panoramas">;
type PannellumViewerInstance = { destroy: () => void; resize: () => void };

declare global {
  interface Window {
    pannellum?: {
      viewer: (container: HTMLElement | string, config: Record<string, unknown>) => PannellumViewerInstance;
    };
  }
}

function PanoramaViewer({ panorama }: { panorama: Panorama }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    if (!window.pannellum) {
      setError("The 360 viewer could not load. Please refresh and try again.");
      return;
    }

    const viewer = window.pannellum.viewer(containerRef.current, {
      type: "equirectangular",
      panorama: panorama.image_url,
      title: panorama.title,
      autoLoad: true,
      compass: true,
      showControls: true,
      showFullscreenCtrl: true,
      hfov: 100,
      minHfov: 45,
      maxHfov: 120
    });

    return () => {
      viewer.destroy();
    };
  }, [panorama]);

  if (error) return <div className="grid h-full place-items-center bg-slate-900 p-8 text-center text-sm font-semibold text-white">{error}</div>;
  return <div ref={containerRef} className="h-full min-h-[420px] w-full" aria-label={`360 degree view of ${panorama.title}`} />;
}

export function PanoramaModal({ panorama, onClose }: { panorama: Panorama; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-sm md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="panorama-modal-title"
        className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Interactive 360 Interior</div>
            <h2 id="panorama-modal-title" className="mt-1 text-xl font-black text-slate-950 md:text-2xl">{panorama.title}</h2>
            {panorama.description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{panorama.description}</p>}
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close 360 viewer"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative h-[72vh] min-h-[420px] bg-slate-950">
          <PanoramaViewer panorama={panorama} />
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
            <Move className="h-4 w-4" /> Drag to look around · Scroll to zoom
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PanoramaPage() {
  const { data: categoryRows = [] } = useTable("panorama_categories", { orderBy: "display_order", ascending: true, eq: { is_active: true } });
  const { data: panoramaRows = [] } = useTable("panoramas", { orderBy: "display_order", ascending: true, eq: { status: "published" } });
  const categories = categoryRows as PanoramaCategory[];
  const panoramas = panoramaRows as Panorama[];
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPanorama, setSelectedPanorama] = useState<Panorama | null>(null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    panoramas.forEach((panorama) => counts.set(panorama.category_id, (counts.get(panorama.category_id) ?? 0) + 1));
    return counts;
  }, [panoramas]);

  const visiblePanoramas = activeCategory === "all" ? panoramas : panoramas.filter((panorama) => panorama.category_id === activeCategory);
  const activeDetails = categories.find((category) => category.id === activeCategory);

  return (
    <>
      <Seo
        title="360 Interior Design Tours | AMK Architects & Engineers"
        description="Explore interactive 360-degree interior design views from AMK Architects & Engineers. Browse categories and step inside selected spaces."
        keywords={["360 interior design", "virtual interior tour", "panoramic interiors", "AMK Architects interiors", "Mysuru interior design"]}
        canonical="/360-interiors"
      />

      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(248,106,13,0.25),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-accent backdrop-blur"><Eye className="h-4 w-4" /> Immersive Interior Tours</div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Step inside our interiors in 360°.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">Choose a category, open a space, and drag across the panoramic view to explore the design from every direction.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8">
          <div className="text-sm font-bold uppercase tracking-wide text-brand-primary">Browse by Category</div>
          <h2 className="mt-2 text-3xl font-black text-slate-950">360 Interior Collections</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-lg border p-5 text-left transition ${activeCategory === "all" ? "border-brand-primary bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:border-orange-200"}`}
          >
            <div className="flex items-center justify-between gap-3"><span className="font-black text-slate-950">All Interiors</span><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-primary">{panoramas.length}</span></div>
            <p className="mt-2 text-sm text-slate-500">View every published 360 interior.</p>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-lg border p-5 text-left transition ${activeCategory === category.id ? "border-brand-primary bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:border-orange-200"}`}
            >
              <div className="flex items-center justify-between gap-3"><span className="font-black text-slate-950">{category.name}</span><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-primary">{categoryCounts.get(category.id) ?? 0}</span></div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{category.description || "Explore this 360 interior collection."}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-brand-primary">{activeDetails?.name ?? "All Interiors"}</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Select a space to explore</h2>
          </div>
          <p className="text-sm text-slate-500">{visiblePanoramas.length} interactive view{visiblePanoramas.length === 1 ? "" : "s"}</p>
        </div>

        {visiblePanoramas.length ? (
          <motion.div layout className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visiblePanoramas.map((panorama) => (
                <motion.button
                  layout
                  key={panorama.id}
                  type="button"
                  onClick={() => setSelectedPanorama(panorama)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <div className="relative aspect-[2/1] overflow-hidden bg-slate-200">
                    <img src={panorama.image_url} alt={panorama.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-slate-950/45 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-brand-primary"><Eye className="h-7 w-7" /></span>
                    </div>
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900"><Maximize2 className="h-3.5 w-3.5" /> Open 360 View</span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-black text-slate-950">{panorama.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{panorama.description || "Open this immersive panorama to explore the complete interior."}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="mt-6"><EmptyState title="No 360 interiors in this category" description="Published panoramic spaces will appear here when they are added by the studio." /></div>
        )}
      </section>

      <AnimatePresence>{selectedPanorama && <PanoramaModal panorama={selectedPanorama} onClose={() => setSelectedPanorama(null)} />}</AnimatePresence>
    </>
  );
}
