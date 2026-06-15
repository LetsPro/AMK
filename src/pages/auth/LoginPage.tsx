import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
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
      await signIn(values.email, values.password);
      toast.success("Logged in", "Welcome back to AMK CRM.");
      navigate("/app");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error("Login failed", message);
    }
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-white"><Building2 /></div>
          <div><h1 className="text-xl font-bold">AMK CRM Login</h1><p className="text-sm text-slate-500">Secure operations workspace</p></div>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input placeholder="Email" type="email" {...form.register("email")} />
          <Input placeholder="Password" type="password" {...form.register("password")} />
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={form.formState.isSubmitting}>Login</Button>
        </form>
        <Link className="mt-4 block text-sm font-medium text-brand-primary" to="/forgot-password">Forgot password?</Link>
      </Card>
    </div>
  );
}
