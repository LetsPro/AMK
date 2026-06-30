import { useState, useEffect } from "react";
import { ExternalLink, Link2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Blueprint Links</h1>
        <p className="text-sm text-slate-500 mt-1">{items.length} blueprint{items.length !== 1 ? "s" : ""} shared with you</p>
      </div>

      {items.length > 3 && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search blueprints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <Link2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500">{search ? "No blueprints match your search." : "No blueprint links shared with you yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((a) => (
            <a key={a.id} href={a.blueprint!.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-primary/40 hover:shadow-md transition-all">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate group-hover:text-brand-primary transition-colors">{a.blueprint!.title}</div>
                {a.blueprint!.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{a.blueprint!.description}</p>}
                {a.stage && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.stage.color ?? "#94a3b8" }} />
                    <span className="text-xs text-slate-400">{a.stage.name}</span>
                  </div>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-brand-primary shrink-0 mt-0.5 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
