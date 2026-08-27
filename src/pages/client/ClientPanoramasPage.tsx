import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useTable } from "@/hooks/useSupabaseTable";
import { PanoramaModal, type Panorama } from "@/pages/public/PanoramaPage";
import type { TableRow } from "@/types/database";

type PanoramaCategory = TableRow<"panorama_categories">;
type PanoramaAssignment = TableRow<"client_panorama_assignments">;

export function ClientPanoramasPage() {
  const { clientId } = useAuth();
  const { data: assignmentRows = [] } = useTable("client_panorama_assignments", { eq: { client_id: clientId ?? "00000000-0000-0000-0000-000000000000" } });
  const { data: panoramaRows = [] } = useTable("panoramas", { orderBy: "display_order", ascending: true, eq: { status: "published" } });
  const { data: categoryRows = [] } = useTable("panorama_categories", { orderBy: "display_order", ascending: true });
  const assignments = assignmentRows as PanoramaAssignment[];
  const categories = categoryRows as PanoramaCategory[];
  const assignedIds = useMemo(() => new Set(assignments.map((assignment) => assignment.panorama_id)), [assignments]);
  const panoramas = (panoramaRows as Panorama[]).filter((panorama) => assignedIds.has(panorama.id));
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPanorama, setSelectedPanorama] = useState<Panorama | null>(null);

  const assignedCategoryIds = useMemo(() => new Set(panoramas.map((panorama) => panorama.category_id)), [panoramas]);
  const visibleCategories = categories.filter((category) => assignedCategoryIds.has(category.id));
  const visiblePanoramas = activeCategory === "all" ? panoramas : panoramas.filter((panorama) => panorama.category_id === activeCategory);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-primary"><Eye className="h-4 w-4" /> Immersive Project Views</div>
        <h1 className="mt-2 text-3xl font-black">My 360 Interiors</h1>
        <p className="mt-1 text-sm text-slate-500">Explore the interactive interior panoramas assigned to your account.</p>
      </div>

      {panoramas.length ? (
        <>
          <Card className="bg-white">
            <div className="mb-3 text-sm font-bold text-slate-950">Filter by category</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveCategory("all")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === "all" ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200"}`}>All ({panoramas.length})</button>
              {visibleCategories.map((category) => {
                const count = panoramas.filter((panorama) => panorama.category_id === category.id).length;
                return <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === category.id ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200"}`}>{category.name} ({count})</button>;
              })}
            </div>
          </Card>

          <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visiblePanoramas.map((panorama) => (
                <motion.button
                  layout
                  key={panorama.id}
                  type="button"
                  onClick={() => setSelectedPanorama(panorama)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <div className="relative aspect-[2/1] overflow-hidden bg-slate-200">
                    <img src={panorama.image_url} alt={panorama.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-slate-950/45 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-brand-primary"><Eye className="h-6 w-6" /></span></div>
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900"><Maximize2 className="h-3.5 w-3.5" /> Open 360 View</span>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-brand-primary">{categoryById.get(panorama.category_id)?.name ?? "Interior"}</div>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{panorama.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{panorama.description || "Open the interactive panorama to explore this interior."}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      ) : (
        <EmptyState title="No 360 interiors assigned" description="Your assigned interactive interior views will appear here when the studio shares them with you." />
      )}

      <AnimatePresence>{selectedPanorama && <PanoramaModal panorama={selectedPanorama} panoramas={panoramas} categoryName={categoryById.get(selectedPanorama.category_id)?.name} onClose={() => setSelectedPanorama(null)} />}</AnimatePresence>
    </div>
  );
}
