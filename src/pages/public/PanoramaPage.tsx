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
const PANNELLUM_VERSION = "2.5.7";
const PANNELLUM_CSS_ID = "pannellum-styles";
const PANNELLUM_SCRIPT_ID = "pannellum-script";
let pannellumLoadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    pannellum?: {
      viewer: (container: HTMLElement | string, config: Record<string, unknown>) => PannellumViewerInstance;
    };
  }
}

function loadPannellum() {
  if (window.pannellum) return Promise.resolve();
  if (pannellumLoadPromise) return pannellumLoadPromise;

  pannellumLoadPromise = new Promise<void>((resolve, reject) => {
    if (!document.getElementById(PANNELLUM_CSS_ID)) {
      const stylesheet = document.createElement("link");
      stylesheet.id = PANNELLUM_CSS_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = `https://cdn.jsdelivr.net/npm/pannellum@${PANNELLUM_VERSION}/build/pannellum.css`;
      document.head.appendChild(stylesheet);
    }

    const existingScript = document.getElementById(PANNELLUM_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");
    script.id = PANNELLUM_SCRIPT_ID;
    script.src = `https://cdn.jsdelivr.net/npm/pannellum@${PANNELLUM_VERSION}/build/pannellum.js`;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => {
      pannellumLoadPromise = null;
      reject(new Error("Pannellum failed to load"));
    }, { once: true });
    if (!existingScript) document.head.appendChild(script);
  });

  return pannellumLoadPromise;
}

function PanoramaViewer({ panorama }: { panorama: Panorama }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    let viewer: PannellumViewerInstance | null = null;
    let cancelled = false;
    setError("");

    loadPannellum()
      .then(() => {
        if (cancelled || !containerRef.current || !window.pannellum) return;
        viewer = window.pannellum.viewer(containerRef.current, {
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
      })
      .catch(() => {
        if (!cancelled) setError("The 360 viewer could not load. Please refresh and try again.");
      });

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [panorama]);

  if (error) return <div className="grid h-full place-items-center bg-slate-900 p-8 text-center text-sm font-semibold text-white">{error}</div>;
  return <div ref={containerRef} className="h-full min-h-[260px] w-full md:min-h-[420px]" aria-label={`360 degree view of ${panorama.title}`} />;
}

export function PanoramaModal({
  panorama,
  panoramas = [panorama],
  designTitle,
  spaceNameById,
  onClose,
}: {
  panorama: Panorama;
  panoramas?: Panorama[];
  designTitle?: string;
  spaceNameById?: ReadonlyMap<string, string>;
  onClose: () => void;
}) {
  const [activePanorama, setActivePanorama] = useState(panorama);

  useEffect(() => setActivePanorama(panorama), [panorama]);

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
        className="flex h-[94vh] max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">{designTitle || activePanorama.design_title || "Interactive 360 Interior"}</div>
            <h2 id="panorama-modal-title" className="mt-1 text-xl font-black text-slate-950 md:text-2xl">{spaceNameById?.get(activePanorama.category_id) || activePanorama.title}</h2>
            {spaceNameById?.get(activePanorama.category_id) && <div className="mt-1 text-sm font-semibold text-slate-700">{activePanorama.title}</div>}
            {activePanorama.description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{activePanorama.description}</p>}
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Close 360 viewer"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative min-h-0 flex-1 bg-slate-950">
          <PanoramaViewer panorama={activePanorama} />
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
            <Move className="h-4 w-4" /> Drag to look around · Scroll to zoom
          </div>
        </div>
        {panoramas.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Scenes in this 360 interior</span>
              <span className="text-xs font-semibold text-slate-400">{panoramas.length} space{panoramas.length === 1 ? "" : "s"}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {panoramas.map((item) => {
                const isActive = item.id === activePanorama.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePanorama(item)}
                    aria-label={`Open ${item.title}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`group w-28 shrink-0 overflow-hidden rounded-lg border bg-white text-left transition md:w-36 ${isActive ? "border-brand-primary ring-2 ring-orange-100" : "border-slate-200 hover:border-orange-300"}`}
                  >
                    <div className="relative aspect-[2/1] overflow-hidden bg-slate-100">
                      <img src={item.image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      {isActive && <span className="absolute inset-0 grid place-items-center bg-slate-950/20"><Eye className="h-5 w-5 text-white" /></span>}
                    </div>
                    <span className={`block truncate px-2 py-2 text-xs font-bold ${isActive ? "text-brand-primary" : "text-slate-700"}`}>{spaceNameById?.get(item.category_id) || item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function PanoramaPage() {
  const { data: categoryRows = [] } = useTable("panorama_categories", { orderBy: "display_order", ascending: true, eq: { is_active: true } });
  const { data: panoramaRows = [] } = useTable("panoramas", { orderBy: "display_order", ascending: true, eq: { status: "published", is_public: true } });
  const categories = categoryRows as PanoramaCategory[];
  const panoramas = panoramaRows as Panorama[];
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const spaceNameById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const panoramaGroups = useMemo(() => {
    const groups = new Map<string, Panorama[]>();
    panoramas.filter((panorama) => categoryById.has(panorama.category_id)).forEach((panorama) => {
      groups.set(panorama.design_id, [...(groups.get(panorama.design_id) ?? []), panorama]);
    });
    return Array.from(groups, ([designId, scenes]) => ({ designId, designTitle: scenes[0].design_title, panoramas: scenes }));
  }, [categoryById, panoramas]);
  const selectedGroup = panoramaGroups.find((group) => group.designId === selectedDesignId);

  return (
    <>
      <Seo
        title="360 Interior Design Tours Mysuru | AMK Architects"
        description="Explore interactive 360-degree interior designs from AMK Architects & Engineers and move between panoramic spaces inside each design."
        keywords={["360 interior design", "virtual interior tour", "panoramic interiors", "AMK Architects interiors", "Mysuru interior design"]}
        canonical="/360-interiors"
      />

      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(248,106,13,0.25),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-accent backdrop-blur"><Eye className="h-4 w-4" /> Immersive Interior Tours</div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Step inside our interiors in 360°.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">Choose a design, open any space, and drag across the panoramic view to explore it from every direction.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-brand-primary">360 Designs</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Select a design to explore</h2>
          </div>
          <p className="text-sm text-slate-500">{panoramaGroups.length} interactive interior{panoramaGroups.length === 1 ? "" : "s"}</p>
        </div>

        {panoramaGroups.length ? (
          <motion.div layout className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {panoramaGroups.map(({ designId, designTitle, panoramas: scenes }) => {
                const panorama = scenes[0];
                return (
                  <motion.button
                    layout
                    key={designId}
                    type="button"
                    onClick={() => setSelectedDesignId(designId)}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                  >
                    <div className="relative aspect-[2/1] overflow-hidden bg-slate-200">
                      <img src={panorama.image_url} alt={designTitle} loading="lazy" decoding="async" fetchPriority="low" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-slate-950/45 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-brand-primary"><Eye className="h-7 w-7" /></span>
                      </div>
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900"><Maximize2 className="h-3.5 w-3.5" /> Open 360 Interior</span>
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">360 Interior Design</span>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-brand-primary">{scenes.length} space{scenes.length === 1 ? "" : "s"}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-950">{designTitle}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{scenes.map((scene) => spaceNameById.get(scene.category_id)).filter((name, index, values) => name && values.indexOf(name) === index).join(" · ") || "Open this immersive design to explore every space."}</p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="mt-6"><EmptyState title="No 360 designs available" description="Published panoramic designs will appear here when they are added by the studio." /></div>
        )}
      </section>

      <AnimatePresence>{selectedGroup && <PanoramaModal panorama={selectedGroup.panoramas[0]} panoramas={selectedGroup.panoramas} designTitle={selectedGroup.designTitle} spaceNameById={spaceNameById} onClose={() => setSelectedDesignId(null)} />}</AnimatePresence>
    </>
  );
}
