import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSiteUrl, SITE_URL } from "@/lib/site";
import type { SeoSettings } from "./types";

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  site_url: SITE_URL,
  location: "Balikpapan, East Kalimantan, Indonesia",
  language: "id",
  competitors: [],
  seed_keywords: [],
  gsc_property: null,
  gsc_links: [],
};

export async function getSeoSettings(supabase: SupabaseClient): Promise<SeoSettings> {
  const { data } = await supabase
    .from("seo_settings")
    .select("site_url, location, language, competitors, seed_keywords, gsc_property, gsc_links")
    .eq("id", 1)
    .maybeSingle();
  const settings = { ...DEFAULT_SEO_SETTINGS, ...(data ?? {}) };
  // Baris lama berisi apex (default migrasi). Apex di-redirect ke www, jadi PageSpeed/crawler
  // akan ikut mengukur redirect itu (temuan palsu "Avoid multiple page redirects").
  return { ...settings, site_url: normalizeSiteUrl(settings.site_url) };
}

/** Nama kota dari lokasi, mis. "Balikpapan, East Kalimantan, Indonesia" → "Balikpapan". */
export function cityFromLocation(location: string): string {
  return location.split(",")[0].trim();
}
