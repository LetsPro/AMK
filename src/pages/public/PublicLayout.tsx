import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Outlet } from "react-router-dom";
import { Building2, CalendarDays, Facebook, Instagram, Linkedin, LogIn, Mail, MapPin, Menu, Phone, Send, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/lib/supabase";

function phoneForWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

const enquiryDefaults = {
  name: "",
  mobile: "",
  email: "",
  projectType: "",
  location: "",
  budget: "",
  timeline: "",
  contactPreference: "WhatsApp",
  services: [] as string[],
  subject: "",
  message: "",
};

const projectTypes = ["Residential", "Commercial", "Interior Design", "Hospitality", "Institutional", "Healthcare", "Development Project"];
const budgetRanges = ["Below 25 Lakhs", "25-50 Lakhs", "50 Lakhs-1 Crore", "1-3 Crore", "3 Crore+"];
const timelines = ["Immediately", "Within 1 Month", "1-3 Months", "3-6 Months", "Planning Stage"];
const serviceOptions = ["Architecture", "Interior", "BIM", "Approvals", "Visualization", "Execution"];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [enquiry, setEnquiry] = useState(enquiryDefaults);
  const { branding } = useAppSettings();
  const navItems = ["home", "about", "projects", "services", "gallery", "contact"];
  const hrefFor = (item: string) => item === "home" ? "/" : `/${item}`;

  useEffect(() => {
    const listener = () => setEnquiryOpen(true);
    window.addEventListener("open-enquiry-modal", listener);
    return () => window.removeEventListener("open-enquiry-modal", listener);
  }, []);

  async function submitEnquiry(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    const enrichedMessage = [
      enquiry.message,
      "",
      "Project Details",
      enquiry.projectType ? `Project Type: ${enquiry.projectType}` : "",
      enquiry.location ? `Location: ${enquiry.location}` : "",
      enquiry.budget ? `Budget: ${enquiry.budget}` : "",
      enquiry.timeline ? `Timeline: ${enquiry.timeline}` : "",
      enquiry.contactPreference ? `Contact Preference: ${enquiry.contactPreference}` : "",
      enquiry.services.length ? `Services: ${enquiry.services.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    const payload = {
      name: enquiry.name,
      mobile: enquiry.mobile || null,
      email: enquiry.email || null,
      subject: enquiry.subject || enquiry.projectType || "Website enquiry",
      message: enrichedMessage,
      source: "website_whatsapp",
    };
    const text = [
      "New AMK website enquiry",
      `Name: ${enquiry.name}`,
      enquiry.mobile ? `Mobile: ${enquiry.mobile}` : "",
      enquiry.email ? `Email: ${enquiry.email}` : "",
      payload.subject ? `Subject: ${payload.subject}` : "",
      enquiry.projectType ? `Project Type: ${enquiry.projectType}` : "",
      enquiry.location ? `Location: ${enquiry.location}` : "",
      enquiry.budget ? `Budget: ${enquiry.budget}` : "",
      enquiry.timeline ? `Timeline: ${enquiry.timeline}` : "",
      enquiry.contactPreference ? `Contact Preference: ${enquiry.contactPreference}` : "",
      enquiry.services.length ? `Services: ${enquiry.services.join(", ")}` : "",
      `Message: ${enquiry.message}`,
    ].filter(Boolean).join("\n");
    const insertPromise = supabase.from("enquiries").insert(payload);
    window.open(`https://wa.me/${phoneForWhatsapp(branding.phone)}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    await insertPromise;
    setSending(false);
    setEnquiryOpen(false);
    setEnquiry(enquiryDefaults);
  }

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
            <Button onClick={() => setEnquiryOpen(true)}><UserPlus className="h-4 w-4" /> Get Started</Button>
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
              <Button onClick={() => { setOpen(false); setEnquiryOpen(true); }}><UserPlus className="h-4 w-4" /> Get Started</Button>
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
            <Button className="mt-5" onClick={() => setEnquiryOpen(true)}>Get Started</Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>© 2026 {branding.companyName} {branding.companySuffix}. All rights reserved.</span>
          <span>Powered by <a className="font-semibold text-brand-accent hover:text-white" href="https://dreambuzz.in" target="_blank" rel="noreferrer">Dreambuzz Solutions</a></span>
        </div>
      </footer>
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white sm:px-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">Project Enquiry</div>
                <h2 className="mt-1 text-2xl font-black">Start a Project</h2>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-md text-slate-200 hover:bg-white/10 hover:text-white" onClick={() => setEnquiryOpen(false)} aria-label="Close enquiry form">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="grid max-h-[calc(92vh-88px)] gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3" onSubmit={submitEnquiry}>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
                <Input required className="h-11" value={enquiry.name} onChange={(event) => setEnquiry({ ...enquiry, name: event.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Mobile</span>
                <Input required className="h-11" value={enquiry.mobile} onChange={(event) => setEnquiry({ ...enquiry, mobile: event.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <Input type="email" className="h-11" value={enquiry.email} onChange={(event) => setEnquiry({ ...enquiry, email: event.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Project Type</span>
                <Select required className="h-11" value={enquiry.projectType} onChange={(event) => setEnquiry({ ...enquiry, projectType: event.target.value })}>
                  <option value="">Select project type</option>
                  {projectTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Project Location</span>
                <Input required className="h-11" value={enquiry.location} onChange={(event) => setEnquiry({ ...enquiry, location: event.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Budget Range</span>
                <Select className="h-11" value={enquiry.budget} onChange={(event) => setEnquiry({ ...enquiry, budget: event.target.value })}>
                  <option value="">Select budget</option>
                  {budgetRanges.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Timeline</span>
                <Select className="h-11" value={enquiry.timeline} onChange={(event) => setEnquiry({ ...enquiry, timeline: event.target.value })}>
                  <option value="">Select timeline</option>
                  {timelines.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Preferred Contact</span>
                <Select className="h-11" value={enquiry.contactPreference} onChange={(event) => setEnquiry({ ...enquiry, contactPreference: event.target.value })}>
                  {["WhatsApp", "Phone Call", "Email"].map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Subject</span>
                <Input className="h-11" value={enquiry.subject} onChange={(event) => setEnquiry({ ...enquiry, subject: event.target.value })} />
              </label>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="mb-2 block text-sm font-medium text-slate-700">Services Required</span>
                <div className="flex flex-wrap gap-2">
                  {serviceOptions.map((service) => {
                    const selected = enquiry.services.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => setEnquiry({
                          ...enquiry,
                          services: selected ? enquiry.services.filter((item) => item !== service) : [...enquiry.services, service],
                        })}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-200 ${selected ? "border-brand-primary bg-brand-primary text-white shadow-sm shadow-orange-200" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"}`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="sm:col-span-2 lg:col-span-3">
                <span className="mb-1 block text-sm font-medium text-slate-700">Project Brief</span>
                <Textarea required className="min-h-32" value={enquiry.message} onChange={(event) => setEnquiry({ ...enquiry, message: event.target.value })} />
              </label>
              <div className="grid gap-3 border-t border-slate-200 pt-5 sm:col-span-2 sm:grid-cols-[1fr_auto] sm:items-center lg:col-span-3">
                <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-brand-primary" /> {branding.phone}</span>
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-primary" /> Consultation Request</span>
                </div>
                <Button disabled={sending} className="w-full sm:w-auto"><Send className="h-4 w-4" /> {sending ? "Sending..." : "Send to WhatsApp"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
