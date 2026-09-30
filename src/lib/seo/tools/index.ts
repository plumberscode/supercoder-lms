import type OpenAI from "openai";
import { createPost } from "@/app/admin/blog/actions";
import { markdownToArticle } from "@/lib/blog/markdown";
import { BUSINESS } from "@/lib/site";
import { analyzeHtml, type NapHints } from "../analyze-page";
import { crawlSite, fetchSitemapUrls, mapLimit, summarizeAudit } from "../audit";
import { TTL, withCache } from "../cache";
import { safeFetch, toUrl } from "../fetch-guard";
import { matchesDomain, rankingGap, slugText, tokenize, topicGap } from "../keyword-gap";
import { findOpportunities } from "../opportunities";
import { keywordIdeas } from "../providers/autocomplete";
import { gscConfigured, gscSearchAnalytics, lastDays, type GscDimension } from "../providers/gsc";
import { getSerpProvider } from "../providers";
import { runPageSpeed } from "../providers/pagespeed";
import type { SerpResult } from "../providers/types";
import { cityFromLocation } from "../settings";
import { REPORT_TYPES, type ReportType, type SeoContext } from "../types";

type Args = Record<string, unknown>;

export type ToolEvent = {
  type: "report_saved" | "draft_created";
  id: string;
  title: string;
  href: string;
};

export type ToolOutput = {
  /** Satu baris untuk kartu tool di UI. */
  summary: string;
  /** Data ringkas untuk LLM (akan di-compact). */
  llm: unknown;
  /** Data lengkap untuk disimpan di laporan. */
  data?: unknown;
  event?: ToolEvent;
};

export type SeoTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run(args: Args, ctx: SeoContext): Promise<ToolOutput>;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), min), max) : fallback;
};
const strList = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter((s): s is string => !!s) : undefined;

export class ToolNotConfiguredError extends Error {}

const hostOf = (site: string) => toUrl(site).hostname.replace(/^www\./, "");

function ourNap(): NapHints {
  return { phones: [BUSINESS.phone], address: BUSINESS.shortAddress.split("(")[0].trim(), city: BUSINESS.city };
}

function requireSerp() {
  const serp = getSerpProvider();
  if (!serp) {
    throw new ToolNotConfiguredError(
      "SERP live belum dikonfigurasi (SERPER_API_KEY kosong). Jangan menebak hasil Google; sarankan admin mengisi key di pengaturan.",
    );
  }
  return serp;
}

async function cachedSerp(ctx: SeoContext, query: string): Promise<SerpResult> {
  const serp = requireSerp();
  const { location, language } = ctx.settings;
  return withCache(ctx.supabase, `serp:${serp.id}:${location}:${query.toLowerCase()}`, serp.id, TTL.serp, () =>
    serp.search(query, { location, language }),
  );
}

function gscProperty(ctx: SeoContext) {
  if (!gscConfigured()) {
    throw new ToolNotConfiguredError(
      "Google Search Console belum dikonfigurasi (GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY kosong).",
    );
  }
  return ctx.settings.gsc_property || `sc-domain:${hostOf(ctx.settings.site_url)}`;
}

/** Ringkasan satu halaman (homepage + sitemap) untuk riset kompetitor & topic gap. */
async function siteSnapshot(ctx: SeoContext, domain: string) {
  const origin = toUrl(domain).origin;
  return withCache(ctx.supabase, `snapshot:${origin}`, "crawler", TTL.crawl, async () => {
    const [home, sitemap] = await Promise.all([
      safeFetch(origin).catch((e: Error) => ({ error: e.message }) as const),
      fetchSitemapUrls(origin),
    ]);
    const homeAnalysis =
      "error" in home || home.status !== 200 ? null : analyzeHtml(home.body, home.finalUrl);
    return {
      origin,
      homeStatus: "error" in home ? home.error : home.status,
      home: homeAnalysis && {
        title: homeAnalysis.title,
        metaDescription: homeAnalysis.metaDescription,
        h1: homeAnalysis.h1,
        h2: homeAnalysis.h2,
        wordCount: homeAnalysis.wordCount,
        jsonLdTypes: homeAnalysis.jsonLdTypes,
        internalLinks: homeAnalysis.internalLinks.length,
      },
      robotsFound: sitemap.robots.found,
      sitemapUrls: sitemap.urls,
      sitemapErrors: sitemap.errors,
      blocked: !homeAnalysis && sitemap.urls.length === 0,
    };
  });
}

const BLOG_PATH = /\/(blog|artikel|article|news|berita|post|posts)\//i;

const tools: SeoTool[] = [
  {
    name: "audit_site",
    description:
      "Audit SEO teknis & on-page seluruh situs: crawl sitemap + link internal, cek status HTTP, title/description duplikat, H1, canonical, noindex, sitemap, broken link, konten tipis. Default: situs kita.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL/domain yang diaudit. Kosongkan untuk situs kita." },
        max_pages: { type: "integer", description: "Maks halaman di-crawl (1–100, default 40)." },
        fresh: { type: "boolean", description: "true = abaikan cache (mis. setelah perbaikan)." },
      },
    },
    async run(args, ctx) {
      const url = str(args.url) ?? ctx.settings.site_url;
      const maxPages = num(args.max_pages, 40, 1, 100);
      const isOurs = matchesDomain(toUrl(url).hostname, hostOf(ctx.settings.site_url));
      const run = async () => {
        const crawl = await crawlSite(url, { maxPages, nap: isOurs ? ourNap() : undefined });
        return {
          summary: summarizeAudit(crawl),
          truncated: crawl.truncated,
          robotsTxt: crawl.robotsTxt,
          pages: crawl.pages.map((p) => ({
            url: p.url,
            status: p.status,
            redirected: p.redirected,
            finalUrl: p.redirected ? p.finalUrl : undefined,
            inSitemap: p.inSitemap,
            ms: p.ms,
            title: p.analysis?.title,
            h1: p.analysis?.h1[0],
            words: p.analysis?.wordCount,
            schema: p.analysis?.jsonLdTypes,
            nap: p.analysis?.nap,
            issues: p.analysis?.issues.map((i) => i.code),
            error: p.error,
          })),
        };
      };
      const key = `audit:${toUrl(url).toString()}:${maxPages}`;
      const result = args.fresh === true ? await run() : await withCache(ctx.supabase, key, "crawler", TTL.crawl, run);
      const { score, stats, issues } = result.summary;
      return {
        summary: `Skor ${score}/100 · ${stats.crawled} halaman · ${issues.length} jenis isu`,
        llm: {
          ...result,
          summary: { score, stats, issues: issues.map((i) => ({ ...i, urls: i.urls.slice(0, 6), affected: i.urls.length })) },
          note: "Crawler tidak menjalankan JavaScript. Skor adalah heuristik internal, bukan skor Google.",
        },
        data: result,
      };
    },
  },
  {
    name: "inspect_page",
    description:
      "Periksa satu URL secara detail: status, redirect, title, meta description, canonical, robots, heading, jumlah kata, gambar tanpa alt, link, JSON-LD, Open Graph, dan sinyal NAP (untuk situs kita).",
    parameters: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
    async run(args, ctx) {
      const url = str(args.url);
      if (!url) throw new Error("url wajib diisi.");
      const res = await safeFetch(url);
      const isOurs = matchesDomain(new URL(res.finalUrl).hostname, hostOf(ctx.settings.site_url));
      const analysis =
        res.status === 200 && (res.headers["content-type"] ?? "").includes("html")
          ? analyzeHtml(res.body, res.finalUrl, isOurs ? ourNap() : undefined)
          : null;
      const llm = {
        requestedUrl: res.requestedUrl,
        finalUrl: res.finalUrl,
        status: res.status,
        redirects: res.redirects,
        responseMs: res.ms,
        xRobotsTag: res.headers["x-robots-tag"] ?? null,
        analysis: analysis && {
          ...analysis,
          internalLinks: analysis.internalLinks.slice(0, 25),
          externalLinks: analysis.externalLinks.slice(0, 25),
          internalLinkCount: analysis.internalLinks.length,
          externalLinkCount: analysis.externalLinks.length,
        },
      };
      return {
        summary: `${res.status} · ${analysis?.title ?? "(tanpa title)"} · ${analysis?.issues.length ?? 0} isu`,
        llm,
        data: { ...llm, analysis },
      };
    },
  },
  {
    name: "pagespeed",
    description: "Core Web Vitals & skor Lighthouse (performance, SEO, accessibility) dari Google PageSpeed Insights. Bisa lambat (±30–60 detik).",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Default: homepage kita." },
        strategy: { type: "string", enum: ["mobile", "desktop"] },
      },
    },
    async run(args, ctx) {
      const url = toUrl(str(args.url) ?? ctx.settings.site_url).toString();
      const strategy = args.strategy === "desktop" ? "desktop" : "mobile";
      const result = await withCache(ctx.supabase, `psi:${strategy}:${url}`, "pagespeed", TTL.pagespeed, () =>
        runPageSpeed(url, strategy),
      );
      return {
        summary: `Performance ${result.scores.performance ?? "?"} · SEO ${result.scores.seo ?? "?"} (${strategy})`,
        llm: result,
        data: result,
      };
    },
  },
  {
    name: "gsc_performance",
    description:
      "Data Google Search Console situs kita (apa yang Google tampilkan untuk kita): klik, impresi, CTR, posisi rata-rata per query/halaman/perangkat/tanggal.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Rentang hari terakhir (7–480, default 28)." },
        dimensions: {
          type: "array",
          items: { type: "string", enum: ["query", "page", "country", "device", "date"] },
          description: "Default ['query'].",
        },
        query_contains: { type: "string" },
        page_contains: { type: "string" },
        row_limit: { type: "integer", description: "Default 50, maks 500." },
      },
    },
    async run(args, ctx) {
      const property = gscProperty(ctx);
      const days = num(args.days, 28, 7, 480);
      const dimensions = (strList(args.dimensions) as GscDimension[] | undefined) ?? ["query"];
      const filters = [
        ...(str(args.query_contains) ? [{ dimension: "query" as const, operator: "contains" as const, expression: str(args.query_contains)! }] : []),
        ...(str(args.page_contains) ? [{ dimension: "page" as const, operator: "contains" as const, expression: str(args.page_contains)! }] : []),
      ];
      const q = { ...lastDays(days), dimensions, rowLimit: num(args.row_limit, 50, 1, 500), filters };
      const rows = await withCache(ctx.supabase, `gsc:${property}:${JSON.stringify(q)}`, "gsc", TTL.gsc, () =>
        gscSearchAnalytics(property, q),
      );
      const totals = rows.reduce((t, r) => ({ clicks: t.clicks + r.clicks, impressions: t.impressions + r.impressions }), {
        clicks: 0,
        impressions: 0,
      });
      return {
        summary: `${rows.length} baris · ${totals.clicks} klik · ${totals.impressions} impresi (${days} hari)`,
        llm: { property, range: q, totals, rows },
        data: { property, range: q, rows },
      };
    },
  },
  {
    name: "search_opportunities",
    description:
      "Cari peluang dari GSC: query 'striking distance' (posisi 4–20, impresi tinggi) dan query top-5 dengan CTR rendah (perbaiki title/description).",
    parameters: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Default 90." },
        min_impressions: { type: "integer", description: "Default 10." },
      },
    },
    async run(args, ctx) {
      const property = gscProperty(ctx);
      const days = num(args.days, 90, 7, 480);
      const q = { ...lastDays(days), dimensions: ["query", "page"] as GscDimension[], rowLimit: 2000 };
      const rows = await withCache(ctx.supabase, `gsc:${property}:${JSON.stringify(q)}`, "gsc", TTL.gsc, () =>
        gscSearchAnalytics(property, q),
      );
      const opps = findOpportunities(rows, { minImpressions: num(args.min_impressions, 10, 1, 10000), periodDays: days });
      return {
        summary: `${opps.strikingDistance.length} striking distance · ${opps.lowCtr.length} CTR rendah`,
        llm: {
          property,
          range: q,
          strikingDistance: opps.strikingDistance.slice(0, 25),
          lowCtr: opps.lowCtr.slice(0, 15),
          note: "potentialClicks = perkiraan kasar tambahan klik/bulan memakai kurva CTR industri.",
        },
        data: opps,
      };
    },
  },
  {
    name: "serp_search",
    description:
      "Lihat apa yang Google tampilkan (live) untuk sebuah keyword di lokasi kita: hasil organik, local pack/Maps, People Also Ask, related searches, knowledge graph, plus posisi kita & kompetitor.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    async run(args, ctx) {
      const query = str(args.query);
      if (!query) throw new Error("query wajib diisi.");
      const serp = await cachedSerp(ctx, query);
      const [row] = rankingGap([serp], hostOf(ctx.settings.site_url), ctx.settings.competitors);
      return {
        summary: `"${query}": kita ${row.ourPosition ? `#${row.ourPosition}` : "tidak ada"} · ${serp.organic.length} hasil`,
        llm: {
          query,
          location: serp.location,
          fetchedAt: serp.fetchedAt,
          ourPosition: row.ourPosition,
          competitorPositions: row.competitors,
          organic: serp.organic.slice(0, 10).map(({ position, domain, title, link }) => ({ position, domain, title, link })),
          localPack: serp.localPack,
          peopleAlsoAsk: serp.peopleAlsoAsk.map((p) => p.question),
          relatedSearches: serp.relatedSearches,
          knowledgeGraph: serp.knowledgeGraph,
          answerBox: serp.answerBox,
        },
        data: serp,
      };
    },
  },
  {
    name: "keyword_ideas",
    description:
      "Ide keyword long-tail & pertanyaan dari Google Autocomplete (gratis, tanpa volume pencarian).",
    parameters: {
      type: "object",
      properties: {
        seed: { type: "string" },
        expand: { type: "boolean", description: "Variasi a–z + pertanyaan (default true)." },
      },
      required: ["seed"],
    },
    async run(args, ctx) {
      const seed = str(args.seed);
      if (!seed) throw new Error("seed wajib diisi.");
      const expand = args.expand !== false;
      const result = await withCache(
        ctx.supabase,
        `autocomplete:${ctx.settings.language}:${expand}:${seed.toLowerCase()}`,
        "autocomplete",
        TTL.autocomplete,
        () => keywordIdeas(seed, { language: ctx.settings.language, expand }),
      );
      return {
        summary: `${result.ideas.length} ide · ${result.questions.length} pertanyaan untuk "${seed}"`,
        llm: { ...result, note: "Tanpa data volume. Urutan tidak mencerminkan popularitas." },
        data: result,
      };
    },
  },
  {
    name: "analyze_competitor",
    description:
      "Riset kompetitor dari situsnya: title/H1/H2 homepage, schema, jumlah URL di sitemap, jumlah artikel blog, halaman lokal (mengandung nama kota), dan sampel halaman yang relevan dengan keyword kita.",
    parameters: {
      type: "object",
      properties: { domain: { type: "string" } },
      required: ["domain"],
    },
    async run(args, ctx) {
      const domain = str(args.domain);
      if (!domain) throw new Error("domain wajib diisi.");
      const snapshot = await siteSnapshot(ctx, domain);
      const city = cityFromLocation(ctx.settings.location).toLowerCase();
      const focus = new Set([city, ...ctx.settings.seed_keywords.flatMap(tokenize)]);

      const urls = snapshot.sitemapUrls;
      const scored = urls
        .map((u) => ({ u, score: tokenize(slugText(u)).filter((t) => focus.has(t)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      const samples = await withCache(ctx.supabase, `samples:${snapshot.origin}:${city}`, "crawler", TTL.crawl, () =>
        mapLimit(scored, 3, async ({ u }) => {
          try {
            const res = await safeFetch(u);
            if (res.status !== 200) return { url: u, status: res.status };
            const a = analyzeHtml(res.body, res.finalUrl);
            return {
              url: u,
              status: res.status,
              title: a.title,
              h1: a.h1[0],
              h2: a.h2.slice(0, 8),
              words: a.wordCount,
              schema: a.jsonLdTypes,
              mentionsCity: res.body.toLowerCase().includes(city),
              hasPhone: /(\+62|\b08)\d[\d\s-]{7,}/.test(res.body),
            };
          } catch (e) {
            return { url: u, error: e instanceof Error ? e.message : String(e) };
          }
        }),
      );

      // Situs dengan proteksi bot (mis. Cloudflare) menolak crawler: pakai indeks Google sebagai gantinya
      let googleIndex: { query: string; pages: { title: string; link: string; snippet: string }[] }[] | null = null;
      if (snapshot.blocked && getSerpProvider()) {
        const host = hostOf(domain);
        googleIndex = await mapLimit([`site:${host}`, `site:${host} ${city}`], 2, async (query) => {
          const serp = await cachedSerp(ctx, query).catch(() => null);
          return { query, pages: (serp?.organic ?? []).map(({ title, link, snippet }) => ({ title, link, snippet })) };
        });
      }

      const llm = {
        domain: snapshot.origin,
        homeStatus: snapshot.homeStatus,
        blocked: snapshot.blocked
          ? `Situs menolak crawler (${snapshot.homeStatus}; ${snapshot.sitemapErrors.join("; ") || "sitemap kosong"}). Kemungkinan proteksi bot.${
              googleIndex ? " Data halaman diambil dari indeks Google (googleIndex)." : " Aktifkan SERP untuk melihat halamannya lewat indeks Google."
            }`
          : undefined,
        googleIndex,
        home: snapshot.home,
        sitemap: {
          totalUrls: urls.length,
          blogUrls: urls.filter((u) => BLOG_PATH.test(u)).length,
          localUrls: urls.filter((u) => slugText(u).toLowerCase().includes(city)),
          sampleSlugs: urls.slice(0, 40).map(slugText),
        },
        relevantPages: samples,
        note: "Tanpa data traffic/backlink (butuh provider berbayar).",
      };
      return {
        summary: snapshot.blocked
          ? `${snapshot.origin}: diblokir untuk crawler${googleIndex ? " · pakai indeks Google" : ""}`
          : `${snapshot.origin}: ${urls.length} URL sitemap · ${llm.sitemap.localUrls.length} halaman lokal`,
        llm,
        data: { ...llm, sitemapUrls: urls },
      };
    },
  },
  {
    name: "keyword_gap",
    description:
      "Keyword gap vs kompetitor: (1) matriks ranking keyword target × domain dari SERP live (bila tersedia), (2) topik/frasa di judul, heading & URL kompetitor yang belum ada di situs kita, (3) query GSC kita bila tersedia.",
    parameters: {
      type: "object",
      properties: {
        competitors: { type: "array", items: { type: "string" }, description: "Default: dari pengaturan (maks 5)." },
        keywords: { type: "array", items: { type: "string" }, description: "Default: seed keyword pengaturan (maks 15)." },
      },
    },
    async run(args, ctx) {
      const ourHost = hostOf(ctx.settings.site_url);
      const competitors = (strList(args.competitors) ?? ctx.settings.competitors).slice(0, 5);
      const keywords = (strList(args.keywords) ?? ctx.settings.seed_keywords).slice(0, 15);
      const notes: string[] = [];

      let rankings: ReturnType<typeof rankingGap> | null = null;
      if (getSerpProvider() && keywords.length) {
        const serps = await mapLimit(keywords, 3, (k) => cachedSerp(ctx, k));
        rankings = rankingGap(serps, ourHost, competitors);
      } else {
        notes.push("SERP live tidak tersedia: matriks ranking dilewati.");
      }

      const [ours, ...comps] = await Promise.all(
        [ctx.settings.site_url, ...competitors].map((d) =>
          siteSnapshot(ctx, d).catch(() => null),
        ),
      );
      const texts = (s: Awaited<ReturnType<typeof siteSnapshot>> | null) =>
        s
          ? [
              s.home?.title ?? "",
              ...(s.home?.h1 ?? []),
              ...(s.home?.h2 ?? []),
              ...s.sitemapUrls.slice(0, 500).map(slugText),
            ].filter(Boolean)
          : [];

      const ourTexts = texts(ours);
      if (gscConfigured()) {
        try {
          const property = gscProperty(ctx);
          const q = { ...lastDays(90), dimensions: ["query"] as GscDimension[], rowLimit: 500 };
          const rows = await withCache(ctx.supabase, `gsc:${property}:${JSON.stringify(q)}`, "gsc", TTL.gsc, () =>
            gscSearchAnalytics(property, q),
          );
          ourTexts.push(...rows.map((r) => r.keys[0]));
        } catch (e) {
          notes.push(`GSC gagal: ${e instanceof Error ? e.message : e}`);
        }
      } else {
        notes.push("GSC belum dikonfigurasi: topik yang sudah kita dapat impresinya tidak diperhitungkan.");
      }

      const blocked = competitors.filter((_, i) => !comps[i] || comps[i]!.blocked);
      if (blocked.length) {
        notes.push(`Situs ini menolak crawler, jadi topiknya tidak ikut dibandingkan: ${blocked.join(", ")}. Gunakan analyze_competitor (fallback indeks Google).`);
      }

      const compTexts = Object.fromEntries(
        competitors.map((c, i) => [c, texts(comps[i])]).filter(([, t]) => t.length > 0),
      );
      const topics = topicGap(ourTexts, compTexts, { minCompetitors: competitors.length > 2 ? 2 : 1 });

      const counts = rankings?.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      }, {});
      return {
        summary: `${rankings ? `${counts?.missing ?? 0} missing · ${counts?.behind ?? 0} behind · ` : ""}${topics.length} topik gap`,
        llm: { ourDomain: ourHost, competitors, rankings, rankingCounts: counts, topicGap: topics.slice(0, 40), notes },
        data: { rankings, topicGap: topics, notes },
      };
    },
  },
  {
    name: "backlink_prospects",
    description:
      "Cari peluang backlink lokal lewat pencarian footprint di Google: sekolah, media lokal, direktori, komunitas, dan mention brand tanpa link. Tandai domain yang sudah link ke kita (dari impor GSC).",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Topik tambahan, mis. 'lomba coding siswa'." },
        extra_queries: { type: "array", items: { type: "string" }, description: "Query footprint tambahan (maks 4)." },
      },
    },
    async run(args, ctx) {
      requireSerp();
      const city = cityFromLocation(ctx.settings.location);
      const ourHost = hostOf(ctx.settings.site_url);
      const queries = [
        `sekolah ${city} ekstrakurikuler coding`,
        `SMA SMP ${city} ekstrakurikuler robotik programming`,
        `direktori kursus ${city}`,
        `komunitas programmer ${city}`,
        `berita ${city} siswa juara lomba coding`,
        `"Supercoder" ${city} -site:${ourHost}`,
        ...(str(args.topic) ? [`${str(args.topic)} ${city}`] : []),
        ...(strList(args.extra_queries) ?? []).slice(0, 4),
      ];

      const serps = await mapLimit(queries, 3, (q) => cachedSerp(ctx, q).catch(() => null));
      const blocked = [ourHost, ...ctx.settings.competitors, ...SOCIAL];
      const linking = new Set(ctx.settings.gsc_links.map((l) => l.domain.replace(/^www\./, "")));

      const prospects = new Map<string, { domain: string; type: string; pages: { title: string; link: string }[]; queries: string[] }>();
      serps.forEach((serp, i) => {
        for (const o of serp?.organic ?? []) {
          if (blocked.some((b) => matchesDomain(o.domain, b))) continue;
          const p = prospects.get(o.domain) ?? { domain: o.domain, type: classifyDomain(o.domain), pages: [], queries: [] };
          if (p.pages.length < 2) p.pages.push({ title: o.title, link: o.link });
          if (!p.queries.includes(queries[i])) p.queries.push(queries[i]);
          prospects.set(o.domain, p);
        }
      });

      const list = [...prospects.values()]
        .map((p) => ({ ...p, alreadyLinking: linking.has(p.domain) }))
        .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || b.queries.length - a.queries.length);

      return {
        summary: `${list.length} prospek dari ${queries.length} query`,
        llm: {
          queries,
          prospects: list.slice(0, 40),
          existingLinkingDomains: ctx.settings.gsc_links.slice(0, 30),
          note: "Prospek dari hasil pencarian, bukan indeks backlink. Profil backlink kompetitor butuh provider berbayar.",
        },
        data: { queries, prospects: list },
      };
    },
  },
  {
    name: "save_report",
    description:
      "Simpan laporan akhir (markdown) ke riwayat laporan. Data lengkap dari tool yang dipakai di giliran ini ikut tersimpan otomatis. Panggil setelah analisis selesai.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: [...REPORT_TYPES] },
        title: { type: "string" },
        summary_md: { type: "string", description: "Isi laporan dalam Markdown (temuan, prioritas, langkah aksi)." },
      },
      required: ["type", "title", "summary_md"],
    },
    async run(args, ctx) {
      const type: ReportType = REPORT_TYPES.includes(args.type as ReportType) ? (args.type as ReportType) : "other";
      const title = str(args.title) ?? "Laporan SEO";
      let data: unknown = { collected: ctx.collected };
      if (JSON.stringify(data).length > 1_000_000) {
        data = { collected: ctx.collected.map((c) => ({ tool: c.tool, args: c.args, data: "(terlalu besar, tidak disimpan)" })) };
      }
      const { data: row, error } = await ctx.supabase
        .from("seo_reports")
        .insert({ conversation_id: ctx.conversationId, type, title, summary_md: str(args.summary_md) ?? "", data })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const href = `/admin/seo/reports/${row.id}`;
      return {
        summary: `Laporan tersimpan: ${title}`,
        llm: { saved: true, id: row.id, href },
        event: { type: "report_saved", id: row.id, title, href },
      };
    },
  },
  {
    name: "create_blog_draft",
    description:
      "Buat DRAFT artikel blog (tidak diterbitkan) dari Markdown. Admin akan meninjau & menerbitkan sendiri. Gunakan hanya bila admin meminta.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title SEO (≤ 60 karakter, mengandung keyword target)." },
        headline: { type: "string", description: "H1 artikel." },
        content_md: { type: "string", description: "Isi artikel Markdown (pakai ## dan ###, tanpa # H1)." },
        meta_description: { type: "string", description: "120–160 karakter." },
        target_keyword: { type: "string" },
      },
      required: ["title", "content_md", "meta_description"],
    },
    async run(args) {
      const title = str(args.title);
      const markdown = str(args.content_md);
      if (!title || !markdown) throw new Error("title dan content_md wajib diisi.");
      const { html, h1 } = markdownToArticle(markdown);
      const result = await createPost({
        title,
        headline: str(args.headline) ?? h1 ?? title,
        slug: "",
        content: html,
        excerpt: "",
        metaDescription: str(args.meta_description) ?? "",
        categoryId: null,
        imageUrl: "",
        imageAlt: "",
        authorName: "Tim Supercoder",
        faq: [],
        noindex: false,
        publishMode: "draft",
        scheduledAt: null,
      });
      if (!result.success) throw new Error(result.error);
      const href = `/admin/blog/edit/${result.id}`;
      return {
        summary: `Draft dibuat: ${title}`,
        llm: { created: true, id: result.id, slug: result.slug, href, targetKeyword: str(args.target_keyword) },
        event: { type: "draft_created", id: result.id, title, href },
      };
    },
  },
];

const SOCIAL = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "wikipedia.org",
  "google.com",
  "shopee.co.id",
  "tokopedia.com",
  "pinterest.com",
];

const TYPE_ORDER = ["sekolah", "media", "direktori", "komunitas", "kampus", "pemerintah", "lainnya"];

export function classifyDomain(domain: string): string {
  const d = domain.toLowerCase();
  if (d.endsWith(".sch.id") || /sekolah|(^|[.-])(sdit|sd|smpit|smp|smait|sman?|smk|mts|man)\d*[.-]/.test(d))
    return "sekolah";
  if (d.endsWith(".ac.id")) return "kampus";
  if (d.endsWith(".go.id")) return "pemerintah";
  if (/(tribun|kaltimpost|prokal|kompas|detik|idntimes|kumparan|liputan6|okezone|antaranews|inibalikpapan|niaga\.asia|kaltim)/.test(d))
    return "media";
  if (/(direktori|directory|listing|yellowpages|kursus|carikursus|daftar)/.test(d)) return "direktori";
  if (/(komunitas|community|forum|meetup|dev|gdg)/.test(d)) return "komunitas";
  return "lainnya";
}

export const SEO_TOOLS = tools;

export function toolDefinitions(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/** Jalankan tool berdasarkan nama & argumen JSON dari model. Tidak pernah melempar. */
export async function executeTool(
  name: string,
  rawArgs: string,
  ctx: SeoContext,
  registry: SeoTool[] = tools,
): Promise<ToolOutput & { ok: boolean }> {
  const tool = registry.find((t) => t.name === name);
  if (!tool) return { ok: false, summary: `Tool tidak dikenal: ${name}`, llm: { error: `Tool tidak dikenal: ${name}` } };

  let args: Args;
  try {
    args = rawArgs.trim() ? (JSON.parse(rawArgs) as Args) : {};
  } catch {
    return { ok: false, summary: "Argumen tidak valid", llm: { error: "Argumen JSON tidak valid." } };
  }

  try {
    const out = await tool.run(args, ctx);
    if (out.data !== undefined) ctx.collected.push({ tool: name, args, data: out.data });
    return { ok: true, ...out };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      summary: message.slice(0, 160),
      llm: { error: message, notConfigured: e instanceof ToolNotConfiguredError },
    };
  }
}
