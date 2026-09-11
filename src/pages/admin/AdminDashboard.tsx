import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Files, Image, IndianRupee, Plus, Upload, Users, View } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type ClientRow = { id: string; name: string; status: string; contract_value: number | null; payment_received: number | null; auth_user_id: string | null; updated_at: string };
type PortfolioRow = { id: string; title: string; status: string; is_featured: boolean; updated_at: string };
type FileRow = { id: string; size: number | null; mime_type: string | null };
type PanoramaRow = { id: string; status: string; is_public: boolean };
type DashboardData = { clients: ClientRow[]; portfolio: PortfolioRow[]; files: FileRow[]; assignedFileIds: Set<string>; panoramas: PanoramaRow[] };
const emptyData: DashboardData = { clients: [], portfolio: [], files: [], assignedFileIds: new Set(), panoramas: [] };

function formatCurrency(value: number, compact = true) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 0 }).format(value);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function MetricCard({ label, value, detail, icon: Icon, tone, onClick }: { label: string; value: number | string; detail: string; icon: LucideIcon; tone: string; onClick: () => void }) {
  return <motion.button whileHover={{ y: -3 }} onClick={onClick} className="group border border-slate-200 bg-white p-5 text-left shadow-[0_12px_36px_rgba(15,23,42,.045)] transition hover:border-slate-300"><div className="flex items-start justify-between"><span className={cn("grid h-11 w-11 place-items-center", tone)}><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-primary" /></div><div className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</div><div className="mt-1 text-sm font-bold text-slate-800">{label}</div><div className="mt-1 text-xs leading-5 text-slate-400">{detail}</div></motion.button>;
}

function RatioBar({ label, value, total, tone = "bg-brand-primary" }: { label: string; value: number; total: number; tone?: string }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return <div><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{label}</span><span className="font-black text-slate-900">{value} <span className="font-medium text-slate-400">({percentage}%)</span></span></div><div className="h-2 bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: .8 }} className={cn("h-full", tone)} /></div></div>;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.from("clients").select("id,name,status,contract_value,payment_received,auth_user_id,updated_at").order("updated_at", { ascending: false }),
      supabase.from("portfolio_projects").select("id,title,status,is_featured,updated_at").order("updated_at", { ascending: false }),
      supabase.from("files").select("id,size,mime_type").is("deleted_at", null),
      supabase.from("client_file_assignments").select("file_id"),
      supabase.from("panoramas").select("id,status,is_public"),
    ]).then(([clients, portfolio, files, assignments, panoramas]) => {
      if (!alive) return;
      setData({ clients: (clients.data ?? []) as ClientRow[], portfolio: (portfolio.data ?? []) as PortfolioRow[], files: (files.data ?? []) as FileRow[], assignedFileIds: new Set((assignments.data ?? []).map((item: { file_id: string }) => item.file_id)), panoramas: (panoramas.data ?? []) as PanoramaRow[] });
      setLoading(false);
    }).catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const contractValue = data.clients.reduce((total, client) => total + (client.contract_value ?? 0), 0);
    const payments = data.clients.reduce((total, client) => total + (client.payment_received ?? 0), 0);
    const outstanding = Math.max(0, contractValue - payments);
    const publishedProjects = data.portfolio.filter((project) => project.status === "published").length;
    const featuredProjects = data.portfolio.filter((project) => project.is_featured && project.status === "published").length;
    const assignedFiles = data.files.filter((file) => data.assignedFileIds.has(file.id)).length;
    const storageUsed = data.files.reduce((total, file) => total + (file.size ?? 0), 0);
    const livePanoramas = data.panoramas.filter((panorama) => panorama.status === "published" && panorama.is_public).length;
    return { contractValue, payments, outstanding, collectionRate: contractValue ? Math.min(100, Math.round((payments / contractValue) * 100)) : 0, activeClients: data.clients.filter((client) => client.status === "Active").length, portalClients: data.clients.filter((client) => client.auth_user_id).length, publishedProjects, featuredProjects, assignedFiles, unassignedFiles: data.files.length - assignedFiles, storageUsed, livePanoramas };
  }, [data]);

  if (loading) return <div className="space-y-5"><div className="h-52 animate-pulse bg-slate-200" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse bg-slate-200" />)}</div></div>;

  const metrics = [
    { label: "Clients", value: data.clients.length, detail: `${stats.activeClients} active · ${stats.portalClients} portal enabled`, icon: Users, tone: "bg-blue-50 text-blue-600", path: "/app/clients" },
    { label: "Portfolio projects", value: data.portfolio.length, detail: `${stats.publishedProjects} published · ${data.portfolio.length - stats.publishedProjects} drafts`, icon: Image, tone: "bg-violet-50 text-violet-600", path: "/app/portfolio" },
    { label: "Documents", value: data.files.length, detail: `${stats.assignedFiles} shared · ${formatBytes(stats.storageUsed)} stored`, icon: Files, tone: "bg-amber-50 text-amber-600", path: "/app/files" },
    { label: "360 interiors", value: data.panoramas.length, detail: `${stats.livePanoramas} published on website`, icon: View, tone: "bg-emerald-50 text-emerald-600", path: "/app/360-interiors" },
  ];

  return <div className="space-y-6">
    <section className="relative overflow-hidden bg-[#0b1020] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,.15)] md:p-8"><div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:64px_64px]" /><div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-brand-primary/25 blur-[100px]" /><div className="relative grid gap-8 xl:grid-cols-[1fr_1.1fr] xl:items-end"><div><div className="text-[10px] font-bold uppercase tracking-[.24em] text-brand-accent">Live business summary</div><h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">The numbers in<br />your workspace.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">A direct summary of client value, received payments, published work, stored documents, and 360 interiors.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate("/app/clients?new=1")}><Plus className="h-4 w-4" /> Add client</Button><Button variant="secondary" onClick={() => navigate("/app/files?upload=1")}><Upload className="h-4 w-4" /> Upload documents</Button></div></div><div className="grid gap-px bg-white/10 sm:grid-cols-3">{[{ label: "Contract value", value: stats.contractValue, icon: IndianRupee }, { label: "Payments received", value: stats.payments, icon: CheckCircle2 }, { label: "Outstanding", value: stats.outstanding, icon: IndianRupee }].map((item) => <div key={item.label} className="bg-[#101728]/90 p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">{item.label}</span><item.icon className="h-4 w-4 text-brand-accent" /></div><div className="mt-4 text-2xl font-black tabular-nums">{formatCurrency(item.value)}</div></div>)}<div className="bg-[#101728]/90 p-5 sm:col-span-3"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-300">Payment collection</span><span className="font-black text-brand-accent">{stats.collectionRate}%</span></div><div className="mt-3 h-2 bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${stats.collectionRate}%` }} transition={{ duration: .8 }} className="h-full bg-gradient-to-r from-brand-primary to-brand-accent" /></div><div className="mt-2 flex justify-between text-[10px] text-slate-600"><span>{formatCurrency(stats.payments, false)} received</span><span>{formatCurrency(stats.outstanding, false)} outstanding</span></div></div></div></div></section>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} onClick={() => navigate(metric.path)} />)}</div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between"><div><h2 className="text-base font-black text-slate-950">Website publishing</h2><p className="mt-1 text-xs text-slate-400">Only published admin content is visible publicly</p></div><Button variant="ghost" onClick={() => navigate("/app/portfolio")} className="text-xs text-brand-primary">Manage</Button></div><div className="mt-7 space-y-6"><RatioBar label="Published portfolio projects" value={stats.publishedProjects} total={data.portfolio.length} /><RatioBar label="Featured portfolio projects" value={stats.featuredProjects} total={data.portfolio.length} tone="bg-violet-500" /><RatioBar label="Public 360 interiors" value={stats.livePanoramas} total={data.panoramas.length} tone="bg-emerald-500" /></div></section>
      <section className="border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between"><div><h2 className="text-base font-black text-slate-950">Document library</h2><p className="mt-1 text-xs text-slate-400">Uploaded and client-shared files</p></div><Button variant="ghost" onClick={() => navigate("/app/files")} className="text-xs text-brand-primary">Open files</Button></div><div className="mt-7 space-y-6"><RatioBar label="Files shared with clients" value={stats.assignedFiles} total={data.files.length} tone="bg-blue-500" /><RatioBar label="Files not assigned" value={stats.unassignedFiles} total={data.files.length} tone="bg-amber-500" /><div className="grid grid-cols-2 gap-px bg-slate-200 pt-px"><div className="bg-slate-50 p-4"><div className="text-2xl font-black text-slate-950">{data.files.length}</div><div className="mt-1 text-xs text-slate-400">Total documents</div></div><div className="bg-slate-50 p-4"><div className="text-2xl font-black text-slate-950">{formatBytes(stats.storageUsed)}</div><div className="mt-1 text-xs text-slate-400">Storage used</div></div></div></div></section>
    </div>

    <section className="border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5"><div><h2 className="text-base font-black text-slate-950">Recently updated clients</h2><p className="mt-1 text-xs text-slate-400">Latest client records and account balances</p></div><Button variant="ghost" onClick={() => navigate("/app/clients")} className="text-xs text-brand-primary">View all</Button></div><div className="divide-y divide-slate-100">{data.clients.slice(0, 6).length ? data.clients.slice(0, 6).map((client) => <button key={client.id} onClick={() => navigate(`/app/clients/${client.id}`)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"><div className="grid h-10 w-10 shrink-0 place-items-center bg-orange-50 text-sm font-black text-brand-primary">{client.name[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-slate-900">{client.name}</div><div className="mt-1 text-xs text-slate-400">{client.status} · {client.auth_user_id ? "Portal enabled" : "Portal not enabled"}</div></div><div className="text-right"><div className="text-sm font-black text-slate-800">{formatCurrency(Math.max(0, (client.contract_value ?? 0) - (client.payment_received ?? 0)))}</div><div className="mt-1 text-[9px] uppercase tracking-[.12em] text-slate-400">Balance</div></div><ArrowRight className="h-4 w-4 text-slate-300" /></button>) : <div className="py-14 text-center text-sm text-slate-400">No clients have been added yet.</div>}</div></section>
  </div>;
}
