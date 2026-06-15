import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTableMutations } from "@/hooks/useSupabaseTable";

export function SettingsPage() {
  const { branding, settingRow } = useAppSettings();
  const { create, update } = useTableMutations("app_settings");
  const [form, setForm] = useState(branding);

  useEffect(() => setForm(branding), [branding]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (settingRow) await update.mutateAsync({ id: settingRow.id, payload: { value: form } });
    else await create.mutateAsync({ key: "branding", value: form });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-sm text-slate-500">Manage logo, brand identity, contact details, and theme colors used across the website and admin UI.</p>
      </div>
      <Card>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={save}>
          <label>
            <span className="mb-1 block text-sm font-medium">Company Name</span>
            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Company Suffix</span>
            <Input value={form.companySuffix} onChange={(e) => setForm({ ...form, companySuffix: e.target.value })} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Logo</span>
            <MediaPicker label="Logo" value={form.logoUrl} onChange={(logoUrl) => setForm({ ...form, logoUrl })} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Email</span>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Phone</span>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Location</span>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          {(["primary", "accent", "secondary", "background"] as const).map((key) => (
            <label key={key}>
              <span className="mb-1 block text-sm font-medium capitalize">{key} Color</span>
              <div className="flex gap-2">
                <Input type="color" className="w-16 p-1" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            </label>
          ))}
          <div className="md:col-span-2">
            <Button disabled={create.isPending || update.isPending}><Save className="h-4 w-4" /> Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
