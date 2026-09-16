import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, CalendarClock, Download, FileText, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SharedRecommendation = {
  id: string;
  title: string;
  description: string;
  document_url: string | null;
  image_url: string | null;
  video_url: string | null;
  category_name: string | null;
  expires_at: string | null;
};

function GuidanceContent({ description }: { description: string }) {
  const sections = description.split(/\n\s*\n/).map((section) => section.trim()).filter(Boolean);
  return <div className="space-y-6">{sections.map((section, index) => {
    const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
    const first = lines[0] ?? "";
    const headingLike = lines.length > 1 && first.length < 80;
    return <section key={`${index}-${first.slice(0, 20)}`} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-7">{headingLike && <h2 className="mb-3 text-xl font-black text-slate-950">{first.replace(/^#+\s*/, "")}</h2>}<div className="space-y-3 text-[15px] leading-8 text-slate-600">{(headingLike ? lines.slice(1) : lines).map((line, lineIndex) => <p key={lineIndex}>{line.replace(/^[-•]\s*/, "")}</p>)}</div></section>;
  })}</div>;
}

export function MaterialRecommendationPage() {
  const { token } = useParams();
  const [item, setItem] = useState<SharedRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    supabase.rpc("get_material_recommendation_by_token", { share_token: token }).then(({ data }) => {
      setItem(((data as SharedRecommendation[] | null) ?? [])[0] ?? null);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4"><div className="animate-pulse text-sm font-semibold text-slate-400">Opening recommendation…</div></div>;

  if (!item) return <div className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-4 py-20"><div className="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl"><AlertCircle className="mx-auto h-12 w-12 text-amber-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">This recommendation is unavailable</h1><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">The link may have expired, been revoked, or the recommendation is no longer published. Ask the administrator for a new link.</p></div></div>;

  return (
    <article className="bg-[#f7f6f2]">
      <header className="relative overflow-hidden bg-[#0b1020] px-4 py-14 text-white md:py-20">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand-accent"><ShieldCheck className="h-4 w-4" /> Private material guidance{item.category_name && <><span className="text-white/30">/</span><span>{item.category_name}</span></>}</div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{item.title}</h1>
          <div className="mt-7 flex flex-wrap items-center gap-3">{item.document_url && <a href={item.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-primary/90"><Download className="h-4 w-4" /> Open document</a>}<span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-slate-300"><CalendarClock className="h-4 w-4 text-brand-accent" /> {item.expires_at ? `Available until ${new Date(item.expires_at).toLocaleDateString("en-IN", { dateStyle: "long" })}` : "No expiry"}</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:py-14">
        {item.image_url && <button type="button" onClick={() => window.open(item.image_url!, "_blank", "noopener,noreferrer")} className="block w-full overflow-hidden rounded-3xl bg-slate-950 shadow-2xl" title="Open full-size image"><img src={item.image_url} alt={item.title} className="max-h-[72vh] w-full object-contain" /></button>}
        {item.video_url && <section className="overflow-hidden rounded-3xl bg-slate-950 shadow-2xl"><video src={item.video_url} controls playsInline preload="metadata" className="max-h-[72vh] w-full object-contain" /></section>}

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <GuidanceContent description={item.description} />
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase tracking-[.16em] text-brand-primary">Recommendation details</div><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-slate-400">Category</dt><dd className="mt-1 font-bold text-slate-900">{item.category_name ?? "General materials"}</dd></div><div><dt className="text-xs text-slate-400">Access</dt><dd className="mt-1 font-bold text-slate-900">Private share link</dd></div></dl></div>
            {item.document_url && <a href={item.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-primary"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-brand-primary"><FileText className="h-5 w-5" /></span><span><span className="block font-black text-slate-950">Supporting document</span><span className="text-xs text-slate-400">Open or download</span></span></a>}
          </aside>
        </div>
      </div>
    </article>
  );
}
