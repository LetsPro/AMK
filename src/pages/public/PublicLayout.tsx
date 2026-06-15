import { Link, Outlet } from "react-router-dom";
import { Building2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-3 font-bold"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-primary text-white"><Building2 /></span>AMK Architects & Engineers</Link>
          <nav className="hidden gap-5 text-sm font-medium md:flex">
            {["about", "projects", "services", "gallery", "testimonials", "contact"].map((item) => <Link key={item} className="capitalize hover:text-brand-primary" to={`/${item}`}>{item.replace("-", " ")}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => location.href = "/login"}><LogIn className="h-4 w-4" /> Login</Button>
            <Button onClick={() => location.href = "/customer-register"}><UserPlus className="h-4 w-4" /> Get Started</Button>
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div><div className="text-lg font-bold">AMK Architects & Engineers</div><p className="mt-2 text-sm text-slate-400">Architecture, engineering, design approvals, and construction operations.</p></div>
          <div className="text-sm text-slate-400">Email: {import.meta.env.VITE_COMPANY_EMAIL ?? "info@amkarchitects.com"}<br />Phone: {import.meta.env.VITE_COMPANY_PHONE ?? "+91 00000 00000"}</div>
          <div className="text-sm text-slate-400">LinkedIn · Instagram · Facebook</div>
        </div>
      </footer>
    </div>
  );
}
