import { gscConfigured } from "./gsc";
import { createSerperProvider } from "./serper";
import type { BacklinkProvider, ProviderStatus, SerpProvider } from "./types";

/** Provider SERP aktif berdasarkan env, atau null bila belum dikonfigurasi. */
export function getSerpProvider(): SerpProvider | null {
  if (process.env.SERPER_API_KEY) return createSerperProvider(process.env.SERPER_API_KEY);
  // Nanti: DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD → createDataForSeoProvider(...)
  return null;
}

/** Belum ada provider backlink gratis; slot untuk DataForSEO nanti. */
export function getBacklinkProvider(): BacklinkProvider | null {
  return null;
}

export function providerStatus(): ProviderStatus[] {
  return [
    {
      id: "crawler",
      label: "Crawler & audit on-page",
      configured: true,
      env: "—",
      note: "Bawaan, gratis. Tidak menjalankan JavaScript.",
    },
    {
      id: "autocomplete",
      label: "Google Autocomplete (ide keyword)",
      configured: true,
      env: "—",
      note: "Gratis, tidak resmi. Tanpa volume pencarian.",
    },
    {
      id: "pagespeed",
      label: "PageSpeed Insights (Core Web Vitals)",
      configured: true,
      env: "PAGESPEED_API_KEY (opsional)",
      note: process.env.PAGESPEED_API_KEY ? "Pakai API key." : "Tanpa key: kuota terbatas.",
    },
    {
      id: "gsc",
      label: "Google Search Console",
      configured: gscConfigured(),
      env: "GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY",
      note: "Gratis. Tambahkan email service account sebagai user di properti GSC.",
    },
    {
      id: "serp",
      label: "SERP live (Serper.dev)",
      configured: !!process.env.SERPER_API_KEY,
      env: "SERPER_API_KEY",
      note: "2.500 kredit gratis saat daftar. Dibutuhkan untuk SERP, keyword gap ranking, dan backlink prospect.",
    },
    {
      id: "backlinks",
      label: "Indeks backlink",
      configured: false,
      env: "DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD",
      note: "Belum tersedia (berbayar). Sementara pakai impor CSV link dari GSC.",
    },
  ];
}
