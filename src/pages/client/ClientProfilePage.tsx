import { useState } from "react";
import { Camera, Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";

export function ClientProfilePage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile() {
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    if (!user?.id) { toast.error("User session not found"); return; }
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      email: user.email ?? "",
      phone,
      role_id: null,
      is_active: true,
    }, { onConflict: "id" });
    if (error) toast.error("Error", error.message);
    else toast.success("Profile updated");
    setSavingProfile(false);
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user!.email!, password: currentPassword });
      if (signInError) { toast.error("Current password is incorrect"); setSavingPassword(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Error", err instanceof Error ? err.message : "Password change failed");
    }
    setSavingPassword(false);
  }

  const initials = (profile?.full_name ?? user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account information and password.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-xl font-black text-brand-primary">
            {initials}
          </div>
        </div>
        <div>
          <div className="font-semibold text-slate-900">{profile?.full_name}</div>
          <div className="text-sm text-slate-500">{user?.email}</div>
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Personal Information</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <Input value={user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 00000 00000" />
        </div>
        <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</Button>
      </div>

      {/* Password form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Change Password</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
          <div className="relative">
            <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="pr-10" />
            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <div className="relative">
            <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="pr-10" />
            <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
        </div>
        <Button onClick={changePassword} disabled={savingPassword}>{savingPassword ? "Changing..." : "Change Password"}</Button>
      </div>
    </div>
  );
}
