import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bookmark, ChevronLeft, ChevronRight, FileText, IndianRupee, LayoutDashboard, LogOut, Menu, TrendingUp, User, X } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/lib/supabase";

const navItems = [
  { to: "/client", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/client/progress", label: "Project Progress", icon: TrendingUp },
  { to: "/client/files", label: "My Files", icon: FileText },
  { to: "/client/blueprints", label: "Blueprints", icon: Bookmark },
  { to: "/client/profile", label: "Profile", icon: User },
];

type Notification = { id: string; title: string; message: string; is_read: boolean; created_at: string };
type ClientCommercials = { name: string; contract_value: number | null; payment_received: number | null };

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not set";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function ClientLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientCommercials, setClientCommercials] = useState<ClientCommercials | null>(null);
  const { clientId, profile, signOut } = useAuth();
  const { branding } = useAppSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("notifications")
      .select("id,title,message,is_read,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setNotifications((data as Notification[]) ?? []));
  }, [profile?.id]);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from("clients")
      .select("name,contract_value,payment_received")
      .eq("id", clientId)
      .maybeSingle()
      .then(({ data }) => setClientCommercials((data as ClientCommercials | null) ?? null));
  }, [clientId]);

  async function markAllRead() {
    if (!profile?.id) return;
    await supabase.from("notifications").update({ is_read: true } as never).eq("user_id", profile.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const showCommercials = Boolean(clientCommercials && (clientCommercials.contract_value !== null || clientCommercials.payment_received !== null));
  const balance = (clientCommercials?.contract_value ?? 0) - (clientCommercials?.payment_received ?? 0);

  const Sidebar = (
    <aside className={cn(
      "flex h-full flex-col border-r border-white/10 bg-slate-950 text-white transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("flex items-center border-b border-white/10 px-4 shrink-0", collapsed ? "h-20 justify-center" : "h-24 justify-start")}>
        <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-lg shadow-black/20", collapsed ? "h-12 w-12" : "h-[4.5rem] w-40 max-w-full")}>
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="block h-full w-full object-contain object-center" /> : <span className="text-lg font-black text-brand-primary">A</span>}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-gradient-to-r from-brand-primary/90 to-brand-accent/90 text-white shadow-lg shadow-brand-primary/20"
                : "text-slate-400 hover:bg-white/8 hover:text-white"
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2", collapsed && "justify-center")}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-accent">
            {initials(profile?.full_name)}
          </div>
          {!collapsed && <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{profile?.full_name ?? "Client"}</div>
            <div className="truncate text-xs text-slate-500">Client</div>
          </div>}
        </div>
      </div>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3.5 top-24 hidden lg:grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:shadow-lg transition-shadow"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className={cn("relative hidden lg:flex shrink-0 transition-all duration-300", collapsed ? "w-20" : "w-64")}>
        <div className="fixed inset-y-0 left-0 z-30" style={{ width: collapsed ? "5rem" : "16rem" }}>
          {Sidebar}
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
              {Sidebar}
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white"><X className="h-4 w-4" /></button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-1 flex-col min-w-0 w-full">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <button onClick={() => { setCollapsed(false); setMobileOpen(true); }} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />

          <div className="relative">
            <button onClick={() => setShowNotifications((v) => !v)} className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-4.5 w-4.5" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="font-semibold text-sm">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unread > 0 && <button onClick={markAllRead} className="text-xs text-brand-primary hover:underline">Mark all read</button>}
                      <button onClick={() => setShowNotifications(false)}><X className="h-4 w-4 text-slate-400" /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {notifications.length ? notifications.map((n) => (
                      <div key={n.id} className={cn("rounded-lg p-3 text-sm", n.is_read ? "text-slate-500" : "bg-orange-50 text-slate-800 dark:bg-orange-950/30")}>
                        <div className="font-medium">{n.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{n.message}</div>
                      </div>
                    )) : <div className="py-8 text-center text-sm text-slate-400">No notifications</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={async () => { await signOut(); navigate("/"); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {showCommercials && (
            <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Quoted Price", formatCurrency(clientCommercials?.contract_value), "bg-orange-50 text-brand-primary"],
                  ["Payment Received", formatCurrency(clientCommercials?.payment_received), "bg-emerald-50 text-emerald-700"],
                  ["Balance", formatCurrency(balance), "bg-slate-50 text-slate-700"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone)}>
                      <IndianRupee className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                      <span className="block truncate text-lg font-black text-slate-950">{value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
