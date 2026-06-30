import { useState, useEffect, useCallback } from "react";
import { Activity, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { TableRow } from "@/types/database";

type Log = TableRow<"activity_logs"> & {
  profile: { full_name: string; email: string } | null;
};

const MODULE_COLORS: Record<string, string> = {
  clients: "bg-blue-100 text-blue-700",
  files: "bg-violet-100 text-violet-700",
  portfolio: "bg-emerald-100 text-emerald-700",
  stages: "bg-amber-100 text-amber-700",
  assignments: "bg-pink-100 text-pink-700",
  blueprints: "bg-cyan-100 text-cyan-700",
  auth: "bg-slate-100 text-slate-600",
  settings: "bg-orange-100 text-orange-700",
};

const ACTION_ICONS: Record<string, string> = {
  create: "bg-emerald-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  login: "bg-slate-400",
  logout: "bg-slate-400",
};

const PAGE_SIZE = 50;

export function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("activity_logs").select("*, profile:profiles(full_name,email)", { count: "exact" });
    if (moduleFilter) query = query.eq("module", moduleFilter);
    if (actionFilter) query = query.eq("action", actionFilter);
    query = query.order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const { data, count } = await query;
    setLogs((data as Log[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, moduleFilter, actionFilter]);

  const loadFilters = useCallback(async () => {
    const [{ data: mods }, { data: acts }] = await Promise.all([
      supabase.from("activity_logs").select("module").limit(200),
      supabase.from("activity_logs").select("action").limit(200),
    ]);
    setModules([...new Set((mods ?? []).map((r: { module: string }) => r.module).filter(Boolean))]);
    setActions([...new Set((acts ?? []).map((r: { action: string }) => r.action).filter(Boolean))]);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadFilters(); }, [loadFilters]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Activity Logs</h1>
          <p className="text-sm text-slate-500">{total.toLocaleString()} total event{total !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="secondary" onClick={() => load()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(0); }} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-brand-primary focus:outline-none">
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {(moduleFilter || actionFilter) && (
          <button onClick={() => { setModuleFilter(""); setActionFilter(""); setPage(0); }} className="text-xs text-slate-500 hover:text-slate-800 underline">Clear filters</button>
        )}
      </div>

      {/* Log list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-slate-50" />)}</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No activity logs found</p>
            <p className="mt-1 text-sm text-slate-400">Activity will appear here as users interact with the system.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", ACTION_ICONS[log.action] ?? "bg-slate-300")} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", MODULE_COLORS[log.module] ?? "bg-slate-100 text-slate-600")}>{log.module}</span>
                    <span className="text-sm font-medium text-slate-800">{log.action}</span>
                    {log.entity_id && <span className="text-xs text-slate-400 truncate max-w-xs font-mono">{log.entity_id}</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-slate-500">{log.profile?.full_name ?? log.profile?.email ?? "System"}</span>
                    <span className="text-xs text-slate-400">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
