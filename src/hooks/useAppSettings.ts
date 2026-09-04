import { useEffect, useMemo } from "react";
import { useTable } from "@/hooks/useSupabaseTable";
import type { Json } from "@/types/database";
import { googleFontsUrl } from "@/lib/googleFonts";

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
  bodyFont: string;
  headingFont: string;
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
  phone: import.meta.env.VITE_COMPANY_PHONE ?? "+91 98458 99066",
  bodyFont: "Inter",
  headingFont: "Manrope"
};

function asRecord(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, string> : {};
}

export function useAppSettings() {
  const { data = [], isLoading } = useTable("app_settings", { eq: { key: "branding" } });
  const branding = useMemo<BrandingSettings>(() => ({ ...defaults, ...asRecord(data[0]?.value) }), [data]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand-primary", branding.primary);
    document.documentElement.style.setProperty("--brand-accent", branding.accent);
    document.documentElement.style.setProperty("--brand-secondary", branding.secondary);
    document.documentElement.style.setProperty("--brand-background", branding.background);
    document.documentElement.style.setProperty("--font-body", `'${branding.bodyFont}', ui-sans-serif, system-ui, sans-serif`);
    document.documentElement.style.setProperty("--font-heading", `'${branding.headingFont}', ui-sans-serif, system-ui, sans-serif`);

    const fontLinkId = "amk-google-fonts";
    let fontLink = document.getElementById(fontLinkId) as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = fontLinkId;
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    fontLink.href = googleFontsUrl([branding.bodyFont, branding.headingFont]);
  }, [branding]);

  return { branding, settingRow: data[0], isLoading };
}
