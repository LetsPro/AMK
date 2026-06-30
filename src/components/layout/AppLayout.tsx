import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Bell, Bookmark, ChevronLeft, ChevronRight, FileStack, Files,
  FolderOpen, Gauge, Globe, LayoutDashboard, LogOut, Menu, Moon,
  Settings, Sun, Users, X
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
  { to: "/app/assignments", label: "File Assignments", icon: Files },
  { to: "/app/blueprints", label: "Blueprint Links", icon: Bookmark },
  { to: "/app/activity", label: "Activity Logs", icon: Activity },
  { to: "/app/cms", label: "Website Management", icon: Globe },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

type Notification = { id: string; title: string; message: string; is_read: boolean };

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { profile, signOut } = useAuth();
  const { branding } = useAppSettings();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("notifications")
      .select("id,title,message,is_read")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setNotifications((data as Notification[]) ?? []));
  }, [profile?.id]);

  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const Sidebar = (
    <aside className={cn(
      "flex h-full flex-col border-r border-white/10 bg-slate-950 text-white transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4 shrink-0">
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent font-black text-sm">
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="h-full w-full object-cover" /> : "A"}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{branding.companyName}</div>
            <div className="truncate text-xs text-slate-400">{branding.companySuffix}</div>
          </div>
        )}
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
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2", collapsed && "justify-center")}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-accent">
            {initials(profile?.full_name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{profile?.full_name ?? "Admin"}</div>
              <div className="truncate text-xs text-slate-500">{profile?.roles?.name ?? ""}</div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3.5 top-20 hidden lg:grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:shadow-lg transition-shadow"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <div className={cn("relative hidden lg:flex shrink-0 transition-all duration-300", collapsed ? "w-20" : "w-64")}>
        <div className="fixed inset-y-0 left-0 z-30" style={{ width: collapsed ? "5rem" : "16rem" }}>
          {Sidebar}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              {Sidebar}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setDark((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="h-4.5 w-4.5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {notifications.length ? notifications.map((n) => (
                      <div key={n.id} className={cn("rounded-lg p-3 text-sm", n.is_read ? "text-slate-500" : "bg-orange-50 text-slate-800")}>
                        <div className="font-medium">{n.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{n.message}</div>
                      </div>
                    )) : (
                      <div className="py-8 text-center text-sm text-slate-400">No notifications</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button variant="ghost" onClick={handleSignOut} className="gap-2 text-slate-500">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Sign out</span>
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
