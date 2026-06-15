import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, Bell, BriefcaseBusiness, Building2, Calculator, CalendarCheck, ChevronLeft, ChevronRight,
  CreditCard, FileText, GalleryHorizontal, Image, LayoutDashboard, LogOut, Menu, Moon, Plus, ReceiptText,
  Search, Settings, ShieldCheck, Sun, Ticket, Users
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { cn, initials } from "@/lib/utils";
import { useTable } from "@/hooks/useSupabaseTable";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/leads", label: "Leads", icon: BriefcaseBusiness },
  { to: "/app/customers", label: "Customers", icon: Users },
  { to: "/app/clients", label: "Clients", icon: Building2 },
  { to: "/app/projects", label: "Projects", icon: BarChart3 },
  { to: "/app/calculations", label: "Calculator", icon: Calculator },
  { to: "/app/quotations", label: "Quotations", icon: FileText },
  { to: "/app/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/app/payments", label: "Payments", icon: CreditCard },
  { to: "/app/staff", label: "Staff", icon: ShieldCheck },
  { to: "/app/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/app/expenses", label: "Expenses", icon: ReceiptText },
  { to: "/app/tickets", label: "Support", icon: Ticket },
  { to: "/app/cms", label: "Website CMS", icon: GalleryHorizontal },
  { to: "/app/media", label: "Media", icon: Image },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/activity", label: "Activity Logs", icon: Settings }
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [] } = useTable("notifications", { limit: 8, orderBy: "created_at", eq: profile?.id ? { user_id: profile.id } : undefined });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const unread = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  return (
    <div className="flex min-h-screen bg-brand-background text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-white/50 bg-slate-950 text-white shadow-2xl transition-all lg:block", collapsed ? "w-20" : "w-72")}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent font-black">AMK</div>
          {!collapsed && <div><div className="font-bold">AMK Architects</div><div className="text-xs text-slate-400">& Engineers</div></div>}
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <NavLink key={item.to} end={item.to === "/app"} to={item.to} className={({ isActive }) => cn("group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-glow" : "text-slate-300 hover:bg-white/10 hover:text-white")}>
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setCollapsed((value) => !value)} className="absolute -right-4 top-20 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-900 shadow">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <div className={cn("flex min-h-screen flex-1 flex-col transition-all", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/60 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
          <Button variant="ghost" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-primary dark:border-slate-800 dark:bg-slate-900" placeholder="Search leads, projects, invoices..." />
          </div>
          <Button onClick={() => navigate("/app/leads")}><Plus className="h-4 w-4" /> Lead</Button>
          <Button variant="ghost" onClick={() => setDark((value) => !value)}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
          <div className="relative">
            <Button variant="ghost" onClick={() => setShowNotifications((value) => !value)}><Bell className="h-5 w-5" />{unread > 0 && <span className="rounded-full bg-brand-danger px-1.5 text-xs text-white">{unread}</span>}</Button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 font-semibold">Notifications</div>
                  {notifications.length ? notifications.map((item) => <div key={item.id} className="rounded-md p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><div className="font-medium">{item.title}</div><div className="text-xs text-slate-500">{item.message}</div></div>) : <div className="py-8 text-center text-sm text-slate-500">No notifications</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{initials(profile?.full_name)}</div>
            <div className="text-sm"><div className="font-semibold">{profile?.full_name ?? "User"}</div><div className="text-xs text-slate-500">{profile?.roles?.name ?? "Role pending"}</div></div>
          </div>
          <Button variant="ghost" onClick={signOut}><LogOut className="h-5 w-5" /></Button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
