import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Home, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(6, "Password must be at least 6 characters") });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent font-black text-sm">A</div>
          <div>
            <div className="font-bold">AMK Architects</div>
            <div className="text-xs text-slate-400">& Engineers</div>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black leading-tight">Secure Client &amp; Admin Portal</h1>
          <p className="mt-4 text-slate-400 leading-relaxed">Manage projects, files, stages, and client communications from one unified platform.</p>
        </div>
        <div className="text-xs text-slate-600">© {new Date().getFullYear()} AMK Architects & Engineers</div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-primary hover:text-brand-primary">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-white"><Building2 className="h-5 w-5" /></div>
            <div><div className="font-bold">AMK Architects & Engineers</div></div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Sign in to your account</h2>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <Input
                  type="email"
                  className="pl-10"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <Input
                  type="password"
                  className="pl-10"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && <p className="mt-1 text-xs text-red-600">{form.formState.errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <Link to="/forgot-password" className="mt-4 block text-center text-sm text-brand-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
