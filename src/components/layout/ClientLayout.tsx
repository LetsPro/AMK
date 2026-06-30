import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bookmark, FileText, LayoutDashboard, LogOut, Menu, TrendingUp, User, X } from "lucide-react";
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

export function ClientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { profile, signOut } = useAuth();
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

  async function markAllRead() {
    if (!profile?.id) return;
    await supabase.from("notifications").update({ is_read: true } as never).eq("user_id", profile.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const Sidebar = (
    <aside className="flex h-full flex-col bg-slate-950 text-white border-r border-white/10">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4 shrink-0">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent font-black text-sm overflow-hidden">
          {branding.logoUrl ? <img src={branding.logoUrl} alt="logo" className="h-full w-full object-cover" /> : "A"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{branding.companyName}</div>
          <div className="truncate text-xs text-slate-400">Client Portal</div>
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
                ? "bg-gradient-to-r from-brand-primary/90 to-brand-accent/90 text-white shadow-lg"
                : "text-slate-400 hover:bg-white/8 hover:text-white"
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-accent">
            {initials(profile?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{profile?.full_name ?? "Client"}</div>
            <div className="truncate text-xs text-slate-500">Client</div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:flex w-60 shrink-0 fixed inset-y-0 left-0 z-30">
        {Sidebar}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden">
              {Sidebar}
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white"><X className="h-4 w-4" /></button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-60 flex min-h-screen flex-1 flex-col min-w-0 w-full">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 lg:hidden">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
