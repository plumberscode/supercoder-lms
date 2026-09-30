import type { SupabaseClient } from "@supabase/supabase-js";

export type SeoSettings = {
  site_url: string;
  location: string;
  language: string;
  competitors: string[];
  seed_keywords: string[];
  gsc_property: string | null;
  gsc_links: { domain: string; links: number }[];
};

export const REPORT_TYPES = [
  "audit",
  "competitor",
  "keyword_gap",
  "serp",
  "opportunities",
  "backlinks",
  "other",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  audit: "Audit Website",
  competitor: "Riset Kompetitor",
  keyword_gap: "Keyword Gap",
  serp: "SERP",
  opportunities: "Peluang Pencarian",
  backlinks: "Peluang Backlink",
  other: "Lainnya",
};

/** Konteks yang dibagikan ke semua tool selama satu giliran agent. */
export type SeoContext = {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string | null;
  settings: SeoSettings;
  /** Data lengkap hasil tool di giliran ini; ikut disimpan saat save_report. */
  collected: { tool: string; args: unknown; data: unknown }[];
};
