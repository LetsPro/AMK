import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTableMutations } from "@/hooks/useSupabaseTable";
import { GOOGLE_FONTS, googleFontsUrl } from "@/lib/googleFonts";

export function SettingsPage() {
  const { branding, settingRow } = useAppSettings();
  const { create, update } = useTableMutations("app_settings");
  const [form, setForm] = useState(branding);

  useEffect(() => setForm(branding), [branding]);

  useEffect(() => {
    const previewId = "amk-google-font-preview";
    let link = document.getElementById(previewId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = previewId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = googleFontsUrl([form.bodyFont, form.headingFont]);
    return () => link?.remove();
  }, [form.bodyFont, form.headingFont]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (settingRow) await update.mutateAsync({ id: settingRow.id, payload: { value: form } });
    else await create.mutateAsync({ key: "branding", value: form });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-sm text-slate-500">Manage the logo, typography, contact details, and theme used across the public website, admin area, and client portal.</p>
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
          <div className="md:col-span-2 grid gap-5 rounded-lg border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium">Body Font</span>
              <Select value={form.bodyFont} style={{ fontFamily: form.bodyFont }} onChange={(e) => setForm({ ...form, bodyFont: e.target.value })}>
                {GOOGLE_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
              </Select>
              <span className="mt-2 block text-xs text-slate-500">Used for paragraphs, navigation, forms, tables, and buttons.</span>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Heading Font</span>
              <Select value={form.headingFont} style={{ fontFamily: form.headingFont }} onChange={(e) => setForm({ ...form, headingFont: e.target.value })}>
                {GOOGLE_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
              </Select>
              <span className="mt-2 block text-xs text-slate-500">Used for page titles and all section headings.</span>
            </label>
            <div className="md:col-span-2 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 style={{ fontFamily: form.headingFont }} className="text-2xl font-bold">Architecture shaped around people.</h3>
              <p style={{ fontFamily: form.bodyFont }} className="mt-2 text-sm leading-6 text-slate-600">Preview how your selected heading and body fonts work together across the application.</p>
            </div>
          </div>
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
