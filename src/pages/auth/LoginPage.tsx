import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { normalizePhoneNumber } from "@/lib/phone";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or phone number").refine(
    (value) => value.includes("@") ? z.string().email().safeParse(value).success : normalizePhoneNumber(value) !== null,
    "Enter a valid email address or phone number",
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { branding } = useAppSettings();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setError("");
    try {
      const destination = await signIn(values.identifier, values.password);
      toast.success("Welcome back!", "You have signed in successfully.");
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-950">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 md:min-h-[600px] md:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden overflow-hidden bg-slate-900 md:block">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85" alt="Contemporary AMK architecture" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
          <Link to="/" className="absolute left-7 top-7 flex h-20 w-36 items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-xl" aria-label="Return to the AMK website">
            {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="h-full w-full object-contain" /> : <Building2 className="h-7 w-7 text-brand-primary" />}
          </Link>
        </div>

        <div className="flex items-center p-6 sm:p-10">
          <div className="w-full">
            <div className="flex justify-center md:hidden">
              <Link to="/" className="flex h-20 w-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3" aria-label="Return to the AMK website">
                {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.companyName} className="h-full w-full object-contain" /> : <Building2 className="h-7 w-7 text-brand-primary" />}
              </Link>
            </div>

            <div className="mt-7 text-center md:mt-0 md:text-left">
              <h1 className="font-sans text-3xl font-bold tracking-tight">Sign in</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Clients and administrators can use their registered email address or phone number.</p>
            </div>

            <form className="mt-7 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">User ID <span className="font-normal text-slate-400">(Email or phone)</span></label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input type="text" inputMode="text" autoComplete="username" placeholder="name@example.com or 9876543210" className="h-12 rounded-xl pl-10" {...form.register("identifier")} />
                </div>
                {form.formState.errors.identifier && <p className="mt-1.5 text-xs text-red-600">{form.formState.errors.identifier.message}</p>}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="h-12 rounded-xl px-10" {...form.register("password")} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {form.formState.errors.password && <p className="mt-1.5 text-xs text-red-600">{form.formState.errors.password.message}</p>}
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <Button className="h-12 w-full rounded-xl" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Signing in..." : "Sign in"}</Button>
            </form>

            <Link to="/" className="mt-6 block text-center text-sm font-medium text-slate-500 hover:text-brand-primary">Back to website</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
