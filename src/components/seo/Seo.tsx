import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const SITE_URL = "https://www.amkarchitects.in";
const DEFAULT_OG_IMAGE = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function Seo({
  title,
  description,
  keywords = [],
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const fullCanonical = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
    const keywordString = keywords.join(", ");

    document.title = title;
    upsertMeta("name", "description", description);
    if (keywordString) upsertMeta("name", "keywords", keywordString);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", fullCanonical);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:url", fullCanonical);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:site_name", "AMK Architects & Engineers");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    if (jsonLd) upsertJsonLd("page-jsonld", jsonLd);
    else {
      const existing = document.getElementById("page-jsonld");
      if (existing) existing.remove();
    }
  }, [title, description, keywords, canonical, ogType, ogImage, noIndex, jsonLd]);

  return null;
}

export const SITE_BASE_URL = SITE_URL;
