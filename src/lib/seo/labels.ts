/** Label UI untuk tiap tool agent (aman diimpor di client). */
export const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  audit_site: { label: "Audit website", icon: "🩺" },
  inspect_page: { label: "Periksa halaman", icon: "🔍" },
  pagespeed: { label: "PageSpeed", icon: "⚡" },
  gsc_performance: { label: "Search Console", icon: "📈" },
  search_opportunities: { label: "Peluang GSC", icon: "🎯" },
  serp_search: { label: "SERP Google", icon: "🌐" },
  keyword_ideas: { label: "Ide keyword", icon: "💡" },
  analyze_competitor: { label: "Analisis kompetitor", icon: "🕵️" },
  keyword_gap: { label: "Keyword gap", icon: "🧩" },
  backlink_prospects: { label: "Prospek backlink", icon: "🔗" },
  save_report: { label: "Simpan laporan", icon: "💾" },
  create_blog_draft: { label: "Draft artikel", icon: "✍️" },
};

export const QUICK_ACTIONS: { label: string; prompt: string; needs?: "serp" | "gsc" }[] = [
  {
    label: "🩺 Audit website",
    prompt: "Lakukan audit SEO teknis & on-page untuk website kita, cek juga PageSpeed homepage (mobile). Prioritaskan perbaikannya lalu simpan laporannya.",
  },
  {
    label: "🕵️ Riset kompetitor",
    prompt: "Riset semua kompetitor di pengaturan: bandingkan halaman lokal, konten/blog, schema, dan sinyal lokal mereka dengan Supercoder. Apa yang mereka lakukan yang belum kita lakukan? Simpan laporannya.",
  },
  {
    label: "🧩 Keyword gap",
    prompt: "Cari keyword gap antara kita dan kompetitor, lalu usulkan 5 halaman/artikel baru dengan target keyword masing-masing. Simpan laporannya.",
  },
  {
    label: "🌐 Lihat Google",
    prompt: "Apa yang Google tampilkan untuk \"kursus coding balikpapan\"? Siapa di atas kita, fitur SERP apa yang muncul, dan apa yang perlu kita lakukan untuk naik?",
    needs: "serp",
  },
  {
    label: "🎯 Peluang pencarian",
    prompt: "Cari peluang dari Search Console: query yang hampir masuk top 3 dan query dengan CTR rendah. Usulkan perbaikan konkret per halaman. Simpan laporannya.",
    needs: "gsc",
  },
  {
    label: "🔗 Peluang backlink",
    prompt: "Cari peluang backlink lokal (sekolah, media, direktori, komunitas di Balikpapan) dan beri ide cara pendekatan untuk masing-masing jenis. Simpan laporannya.",
    needs: "serp",
  },
];
