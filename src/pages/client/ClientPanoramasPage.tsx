import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Maximize2 } from "lucide-react";
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
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const panoramaGroups = useMemo(() => {
    const groups = new Map<string, Panorama[]>();
    panoramas.forEach((panorama) => groups.set(panorama.design_id, [...(groups.get(panorama.design_id) ?? []), panorama]));
    return Array.from(groups, ([designId, scenes]) => ({ designId, designTitle: scenes[0].design_title, panoramas: scenes }));
  }, [panoramas]);
  const spaceNameById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const selectedGroup = panoramaGroups.find((group) => group.designId === selectedDesignId);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-primary"><Eye className="h-4 w-4" /> Immersive Project Views</div>
        <h1 className="mt-2 text-3xl font-black">My 360 Interiors</h1>
        <p className="mt-1 text-sm text-slate-500">Explore the interactive interior panoramas assigned to your account.</p>
      </div>

      {panoramas.length ? (
        <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                  >
                    <div className="relative aspect-[2/1] overflow-hidden bg-slate-200">
                      <img src={panorama.image_url} alt={designTitle} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                      <div className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-slate-950/45 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-brand-primary"><Eye className="h-6 w-6" /></span></div>
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900"><Maximize2 className="h-3.5 w-3.5" /> Open 360 Interior</span>
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-brand-primary">360 Interior Design</span>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-brand-primary">{scenes.length} space{scenes.length === 1 ? "" : "s"}</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-950">{designTitle}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{scenes.map((scene) => spaceNameById.get(scene.category_id)).filter((name, index, values) => name && values.indexOf(name) === index).join(" · ") || "Open this interactive design to explore every space."}</p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
      ) : (
        <EmptyState title="No 360 interiors assigned" description="Your assigned interactive interior views will appear here when the studio shares them with you." />
      )}

      <AnimatePresence>{selectedGroup && <PanoramaModal panorama={selectedGroup.panoramas[0]} panoramas={selectedGroup.panoramas} designTitle={selectedGroup.designTitle} spaceNameById={spaceNameById} onClose={() => setSelectedDesignId(null)} />}</AnimatePresence>
    </div>
  );
}
