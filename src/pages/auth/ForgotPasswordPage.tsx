import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Reset password</h1>
        <p className="mb-5 mt-2 text-sm text-slate-500">Enter your account email to receive a secure reset link.</p>
        <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); await resetPassword(email); setMessage("Password reset email sent."); toast.success("Reset link sent", "Check your email for password reset instructions."); }}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
          <Button className="w-full">Send reset link</Button>
        </form>
        {message && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        <Link className="mt-4 block text-sm font-medium text-brand-primary" to="/login">Back to login</Link>
      </Card>
    </div>
  );
}
