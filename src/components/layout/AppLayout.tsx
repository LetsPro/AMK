import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, ChevronLeft, ChevronRight, Edit3, Eye, FileStack,
  FolderOpen, Gauge, Images, LayoutDashboard, LogOut, Menu, Search,
  Settings, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { cn, initials } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAppSettings } from "@/hooks/useAppSettings";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/portfolio", label: "Portfolio", icon: Gauge },
  { to: "/app/files", label: "My Files", icon: FolderOpen },
  { to: "/app/stages", label: "Stages", icon: FileStack },
  { to: "/app/cms", label: "Website CMS", icon: Edit3 },
  { to: "/app/media", label: "Media", icon: Images },
  { to: "/app/360-interiors", label: "360 Interiors", icon: Eye },
  { to: "/app/materials", label: "Material Guides", icon: BookOpen },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const pageNames = Object.fromEntries(navItems.map((item) => [item.to, item.label]));
type Notification = { id: string; title: string; message: string; is_read: boolean };

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { profile, signOut } = useAuth();
  const { branding } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("notifications").select("id,title,message,is_read").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => setNotifications((data as Notification[]) ?? []));
  }, [profile?.id]);

  const unread = useMemo(() => notifications.filter((notification) => !notification.is_read).length, [notifications]);
  const currentPage = pageNames[location.pathname] ?? (location.pathname.startsWith("/app/clients/") ? "Client Details" : "Administration");

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const Sidebar = (
    <aside className={cn("flex h-full flex-col overflow-hidden border-r border-white/[.08] bg-[#0b1020] text-white transition-all duration-300", collapsed ? "w-[84px]" : "w-[292px]")}>
      <div className="flex h-24 shrink-0 items-center justify-center border-b border-white/[.08] px-3">
        <div className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-white p-2 shadow-lg shadow-black/20", collapsed ? "h-12 w-12" : "h-16 w-40")}>
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="h-full w-full object-contain" /> : <span className="text-2xl font-bold text-brand-primary">A</span>}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 [scrollbar-width:none]">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn("group relative flex min-h-12 items-center gap-3 overflow-hidden px-3 transition-all", isActive ? "bg-white/[.095] text-white" : "text-slate-400 hover:bg-white/[.045] hover:text-white", collapsed && "justify-center px-0")}>
            {({ isActive }) => <>
              {isActive && <motion.span layoutId="admin-nav-active" className="absolute inset-y-2 left-0 w-0.5 bg-brand-primary" />}
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center transition-colors", isActive ? "bg-brand-primary text-white" : "bg-white/[.045] text-slate-500 group-hover:text-slate-200")}><item.icon className="h-4 w-4" /></span>
              {!collapsed && <span className="truncate text-[13px] font-semibold">{item.label}</span>}
            </>}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[.08] p-3">
        {!collapsed && <div className="mb-3 flex items-center gap-2 border border-emerald-400/10 bg-emerald-400/[.06] px-3 py-2 text-[10px] font-semibold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Workspace connected</div>}
        <div className={cn("flex items-center gap-3 px-2 py-2", collapsed && "justify-center px-0")}>
          <div className="grid h-9 w-9 shrink-0 place-items-center bg-brand-primary/15 text-xs font-black text-brand-accent">{initials(profile?.full_name)}</div>
          {!collapsed && <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{profile?.full_name ?? "Administrator"}</div><div className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-slate-600">{profile?.roles?.name ?? "Admin"}</div></div>}
          {!collapsed && <button onClick={handleSignOut} className="grid h-8 w-8 place-items-center text-slate-600 transition hover:bg-white/5 hover:text-white" title="Sign out"><LogOut className="h-4 w-4" /></button>}
        </div>
      </div>
      <button onClick={() => setCollapsed((value) => !value)} className="absolute -right-3.5 top-24 hidden h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:border-brand-primary hover:text-brand-primary lg:grid" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>{collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}</button>
    </aside>
  );

  return (
    <div className="admin-shell flex min-h-screen bg-[#f4f5f7] font-sans text-slate-900">
      <div className={cn("relative hidden shrink-0 transition-all duration-300 lg:flex", collapsed ? "w-[84px]" : "w-[292px]")}><div className="fixed inset-y-0 left-0 z-30" style={{ width: collapsed ? 84 : 292 }}>{Sidebar}</div></div>

      <AnimatePresence>{mobileOpen && <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} /><motion.div initial={{ x: -310 }} animate={{ x: 0 }} exit={{ x: -310 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 left-0 z-50 w-[292px] lg:hidden">{Sidebar}<button onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center bg-white/10 text-white"><X className="h-4 w-4" /></button></motion.div></>}</AnimatePresence>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-7">
          <button className="grid h-10 w-10 place-items-center border border-slate-200 text-slate-600 lg:hidden" onClick={() => { setCollapsed(false); setMobileOpen(true); }}><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1"><div className="text-[9px] font-bold uppercase tracking-[.2em] text-brand-primary">AMK Administration</div><div className="mt-1 truncate text-sm font-bold text-slate-900">{currentPage}</div></div>
          <button onClick={() => navigate("/app/clients")} className="hidden h-10 w-64 items-center gap-2 border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-400 transition hover:border-slate-300 sm:flex"><Search className="h-4 w-4" /> Find a client</button>
          <div className="relative">
            <button onClick={() => setShowNotifications((value) => !value)} className="relative grid h-10 w-10 place-items-center border border-slate-200 bg-white text-slate-500 transition hover:border-brand-primary hover:text-brand-primary"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</button>
            <AnimatePresence>{showNotifications && <motion.div initial={{ opacity: 0, y: 8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .97 }} className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] border border-slate-200 bg-white p-3 shadow-2xl"><div className="mb-2 flex items-center justify-between px-2 py-1"><div><div className="text-sm font-bold">Notifications</div><div className="text-[10px] text-slate-400">Workspace updates</div></div><button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button></div><div className="max-h-80 space-y-1 overflow-y-auto">{notifications.length ? notifications.map((notification) => <div key={notification.id} className={cn("border-l-2 p-3 text-sm", notification.is_read ? "border-slate-200 text-slate-500" : "border-brand-primary bg-orange-50 text-slate-800")}><div className="font-semibold">{notification.title}</div><div className="mt-1 text-xs text-slate-500">{notification.message}</div></div>) : <div className="py-10 text-center text-sm text-slate-400">All caught up.</div>}</div></motion.div>}</AnimatePresence>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="hidden gap-2 text-slate-500 sm:flex"><LogOut className="h-4 w-4" /><span className="text-xs">Sign out</span></Button>
        </header>
        <main className="flex-1 p-4 md:p-7"><Outlet /></main>
      </div>
    </div>
  );
}
