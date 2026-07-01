import { useState, useEffect } from "react";
import { ArrowRight, Bookmark, ExternalLink, Layers3, Link2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import type { TableRow } from "@/types/database";

type Assignment = TableRow<"client_blueprint_assignments"> & {
  blueprint: { title: string; url: string; description: string | null; is_active: boolean } | null;
  stage: { name: string; color: string | null } | null;
};

export function ClientBlueprintsPage() {
  const { clientId } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const { data } = await supabase
        .from("client_blueprint_assignments")
        .select("*, blueprint:blueprint_links(title,url,description,is_active), stage:stages(name,color)")
        .eq("client_id", clientId)
        .eq("is_visible", true)
        .order("display_order");
      const visible = ((data as Assignment[]) ?? []).filter((a) => a.blueprint?.is_active);
      setItems(visible);
      setLoading(false);
    })();
  }, [clientId]);

  const filtered = items.filter((a) => `${a.blueprint?.title ?? ""} ${a.blueprint?.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const stagedCount = items.filter((item) => item.stage).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(248,106,13,0.15),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_38%)] md:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-brand-primary ring-1 ring-orange-100">
                <Bookmark className="h-3.5 w-3.5" />
                Blueprint library
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Blueprint Links</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open approved drawings, plans, and project references shared by the AMK team.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-3xl font-black text-slate-950">{items.length}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">Shared links</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-3xl font-black text-slate-950">{stagedCount}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">Stage linked</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search blueprint links..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 rounded-xl border-slate-200 pl-9" />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          <Layers3 className="h-4 w-4 text-brand-primary" />
          {filtered.length} visible
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Link2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">{search ? "No matching blueprint links" : "No blueprint links yet"}</h2>
          <p className="mt-1 text-sm text-slate-500">{search ? "Try a different title or description." : "Approved blueprint links will appear here once shared."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <a
              key={a.id}
              href={a.blueprint!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/35 hover:shadow-xl hover:shadow-slate-200/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-brand-primary ring-1 ring-orange-100 transition-colors group-hover:bg-brand-primary group-hover:text-white">
                  <Link2 className="h-5 w-5" />
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-300 transition-colors group-hover:border-brand-primary/30 group-hover:bg-orange-50 group-hover:text-brand-primary">
                  <ExternalLink className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-5 min-w-0 flex-1">
                <h2 className="truncate text-lg font-black text-slate-950 transition-colors group-hover:text-brand-primary">{a.blueprint!.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {a.blueprint!.description || "Project blueprint link shared for review."}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                {a.stage && (
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: a.stage.color ?? "#94a3b8" }} />
                    <span className="truncate">{a.stage.name}</span>
                  </span>
                )}
                {!a.stage && <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-400">General</span>}
                <span className={cn("inline-flex items-center gap-1 text-xs font-black text-brand-primary transition-transform group-hover:translate-x-0.5")}>
                  Open link <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
