import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Building2, Facebook, Instagram, Linkedin, LogIn, Mail, MapPin, Menu, Phone, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppSettings } from "@/hooks/useAppSettings";

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { branding } = useAppSettings();
  const navItems = ["home", "about", "projects", "services", "gallery", "contact"];
  const hrefFor = (item: string) => item === "home" ? "/" : `/${item}`;
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-3 overflow-hidden px-4">
          <Link to="/" className="flex items-center" aria-label={`${branding.companyName} ${branding.companySuffix}`}>
            <span className="grid h-20 w-32 place-items-center bg-transparent text-brand-primary md:w-40">
              {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="max-h-16 max-w-full object-contain md:max-h-20" /> : <Building2 className="h-12 w-12" />}
            </span>
          </Link>
          <nav className="hidden gap-5 text-sm font-medium xl:flex">
            {navItems.map((item) => <Link key={item} className="capitalize hover:text-brand-primary" to={hrefFor(item)}>{item.replace("-", " ")}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 xl:flex">
            <Button variant="secondary" onClick={() => location.href = "/login"}><LogIn className="h-4 w-4" /> Login</Button>
            <Button onClick={() => location.href = "/customer-register"}><UserPlus className="h-4 w-4" /> Get Started</Button>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-800 xl:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg xl:hidden">
            <nav className="grid gap-2 text-sm font-semibold">
              {navItems.map((item) => <Link key={item} className="rounded-md px-3 py-2 capitalize hover:bg-orange-50 hover:text-brand-primary" to={hrefFor(item)} onClick={() => setOpen(false)}>{item.replace("-", " ")}</Link>)}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => { setOpen(false); location.href = "/login"; }}><LogIn className="h-4 w-4" /> Login</Button>
              <Button onClick={() => { setOpen(false); location.href = "/customer-register"; }}><UserPlus className="h-4 w-4" /> Get Started</Button>
            </div>
          </div>
        )}
      </header>
      <Outlet />
      <footer className="bg-slate-950 px-4 pt-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-lg font-bold"><span className="grid h-20 w-32 place-items-center bg-transparent">{branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="max-h-20 max-w-full object-contain brightness-0 invert" /> : <Building2 className="text-white" />}</span></div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">Technology-driven architecture, engineering, BIM, parametric design, visualization, digital fabrication, and project execution support.</p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Instagram, Linkedin].map((Icon, index) => <span key={index} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-slate-200"><Icon className="h-4 w-4" /></span>)}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Company</h4>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              {["Home", "About", "Projects", "Services", "Gallery", "Contact"].map((item) => <Link key={item} to={hrefFor(item.toLowerCase())} className="hover:text-white">{item}</Link>)}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Services</h4>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              {["Architecture & Master Planning", "Interior Design", "BIM & Digital Engineering", "Parametric Design", "3D Printing & Fabrication"].map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Contact</h4>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-accent" />{branding.email}</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-accent" />{branding.phone}</span>
              <span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-brand-accent" />{branding.location}</span>
            </div>
            <Button className="mt-5" onClick={() => location.href = "/customer-register"}>Get Started</Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>© 2026 {branding.companyName} {branding.companySuffix}. All rights reserved.</span>
          <span>Powered by <a className="font-semibold text-brand-accent hover:text-white" href="https://dreambuzz.in" target="_blank" rel="noreferrer">Dreambuzz Solutions</a></span>
        </div>
      </footer>
    </div>
  );
}
