import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
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
  return { ...DEFAULT_SEO_SETTINGS, ...(data ?? {}) };
}

/** Nama kota dari lokasi, mis. "Balikpapan, East Kalimantan, Indonesia" → "Balikpapan". */
export function cityFromLocation(location: string): string {
  return location.split(",")[0].trim();
}
