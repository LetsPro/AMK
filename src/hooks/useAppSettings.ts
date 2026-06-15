import { useEffect, useMemo } from "react";
import { useTable } from "@/hooks/useSupabaseTable";
import type { Json } from "@/types/database";

type BrandingSettings = {
  companyName: string;
  companySuffix: string;
  logoUrl: string;
  primary: string;
  accent: string;
  secondary: string;
  background: string;
  location: string;
  email: string;
  phone: string;
};

const defaults: BrandingSettings = {
  companyName: "AMK Architects",
  companySuffix: "& Engineers",
  logoUrl: "",
  primary: "#F86A0D",
  accent: "#FF9B4A",
  secondary: "#333333",
  background: "#F8FAFC",
  location: "Mysuru, Karnataka, India",
  email: import.meta.env.VITE_COMPANY_EMAIL ?? "ar.amk6616@gmail.com",
  phone: import.meta.env.VITE_COMPANY_PHONE ?? "+91 98458 99066"
};

function asRecord(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, string> : {};
}

export function useAppSettings() {
  const { data = [] } = useTable("app_settings", { eq: { key: "branding" } });
  const branding = useMemo<BrandingSettings>(() => ({ ...defaults, ...asRecord(data[0]?.value) }), [data]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand-primary", branding.primary);
    document.documentElement.style.setProperty("--brand-accent", branding.accent);
    document.documentElement.style.setProperty("--brand-secondary", branding.secondary);
    document.documentElement.style.setProperty("--brand-background", branding.background);
  }, [branding]);

  return { branding, settingRow: data[0] };
}
