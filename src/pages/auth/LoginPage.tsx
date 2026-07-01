import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, Home, Lock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAppSettings } from "@/hooks/useAppSettings";

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(6, "Password must be at least 6 characters") });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { branding } = useAppSettings();
  const [error, setError] = useState("");
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setError("");
    try {
      const destination = await signIn(values.email, values.password);
      toast.success("Welcome back!", "You have signed in successfully.");
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.14)] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden min-h-[680px] overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-brand-primary/25 blur-3xl" />
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-300/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xl">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt={branding.companyName} className="block h-full w-full object-contain" />
                  ) : (
                    <Building2 className="h-6 w-6 text-brand-primary" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-wide">{branding.companyName || "AMK Architects"}</div>
                  <div className="text-xs text-slate-400">{branding.companySuffix || "& Engineers"}</div>
                </div>
              </div>
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </div>

            <div className="relative mt-auto max-w-lg pb-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-accent" />
                AMK Architects & Engineers
              </div>
              <h1 className="text-4xl font-black leading-tight">Design, engineering, and project coordination for modern spaces.</h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                A Mysuru-based architecture and engineering studio delivering residential, commercial, BIM, visualization, and execution support.
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <div className="text-xs font-black uppercase tracking-wide text-brand-accent">Studio Contact</div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                  <span>{branding.location || "Mysuru, Karnataka, India"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                  <span>{branding.phone || "+91 98458 99066"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-brand-accent" />
                  <span>{branding.email || "ar.amk6616@gmail.com"}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[680px] items-center justify-center bg-slate-50 px-5 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt={branding.companyName} className="block h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5 text-brand-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-black">{branding.companyName || "AMK Architects"}</div>
                    <div className="text-xs text-slate-400">{branding.companySuffix || "& Engineers"}</div>
                  </div>
                </div>
                <Link to="/" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Home className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-brand-primary ring-1 ring-orange-100">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-950">Sign in</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Access your AMK workspace with your registered credentials.</p>
                </div>

                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="h-12 rounded-xl pl-10"
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-slate-700">Password</label>
                      <Link to="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter password"
                        className="h-12 rounded-xl pl-10"
                        {...form.register("password")}
                      />
                    </div>
                    {form.formState.errors.password && <p className="mt-1 text-xs text-red-600">{form.formState.errors.password.message}</p>}
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button className="h-12 w-full rounded-xl" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                    {!form.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} {branding.companyName || "AMK Architects"} {branding.companySuffix || "& Engineers"}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
