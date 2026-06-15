import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Choose a new password</h1>
        <form className="mt-5 space-y-4" onSubmit={async (event) => { event.preventDefault(); await updatePassword(password); navigate("/app"); }}>
          <Input type="password" value={password} minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
          <Button className="w-full">Update password</Button>
        </form>
      </Card>
    </div>
  );
}
