import { analyzeHtml, normalizeLink, sameSite, type NapHints, type PageAnalysis, type Severity } from "./analyze-page";
import { safeFetch, toUrl, type Fetcher } from "./fetch-guard";

export type CrawledPage = {
  url: string;
  finalUrl: string;
  status: number;
  redirected: boolean;
  ms: number;
  inSitemap: boolean;
  analysis: PageAnalysis | null; // null bila bukan HTML 200
  error?: string;
};

export type CrawlResult = {
  startUrl: string;
  robotsTxt: { found: boolean; sitemaps: string[]; disallowAll: boolean };
  sitemapUrls: string[];
  pages: CrawledPage[];
  /** Link internal yang menuju halaman 4xx/5xx. */
  brokenLinks: { from: string; to: string; status: number }[];
  truncated: boolean;
};

export type AuditIssue = {
  code: string;
  severity: Severity;
  message: string;
  urls: string[];
};

export type AuditSummary = {
  score: number;
  stats: {
    crawled: number;
    ok: number;
    redirects: number;
    errors: number;
    sitemapUrls: number;
    avgResponseMs: number;
  };
  issues: AuditIssue[];
};

/** Ambil semua <loc> dari sitemap (urlset atau sitemapindex). */
export function parseSitemap(xml: string): { urls: string[]; sitemaps: string[] } {
  const locs = [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/gi)].map(
    (m) => m[1].replace(/&amp;/g, "&"),
  );
  return /<sitemapindex/i.test(xml) ? { urls: [], sitemaps: locs } : { urls: locs, sitemaps: [] };
}

export function parseRobots(txt: string): { sitemaps: string[]; disallowAll: boolean } {
  const sitemaps = [...txt.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  // Hanya grup "User-agent: *"
  let inStar = false;
  let disallowAll = false;
  for (const line of txt.split(/\r?\n/)) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") inStar = value === "*";
    else if (inStar && key === "disallow" && value === "/") disallowAll = true;
  }
  return { sitemaps, disallowAll };
}

/** Kunci perbandingan URL: tanpa www, tanpa trailing slash, query tetap dihitung. */
const urlKey = (u: string) => {
  const url = new URL(u);
  return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "") || "/"}${url.search}`;
};

const looksLikeHtml = (body: string) => /^\s*(<!doctype html|<html)/i.test(body.slice(0, 500));

const SKIP_EXT = /\.(jpe?g|png|gif|webp|svg|ico|pdf|zip|mp4|webm|mp3|css|js|xml|txt|woff2?)$/i;

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const index = i++;
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}

/** Ambil daftar URL sitemap sebuah situs (robots.txt → sitemap, satu level sitemapindex). */
export async function fetchSitemapUrls(
  origin: string,
  fetcher: Fetcher = safeFetch,
  limit = 2000,
): Promise<{ robots: CrawlResult["robotsTxt"]; urls: string[]; errors: string[] }> {
  const robots: CrawlResult["robotsTxt"] = { found: false, sitemaps: [], disallowAll: false };
  try {
    const res = await fetcher(`${origin}/robots.txt`, { accept: "text/plain" });
    // Situs dengan "soft 404" membalas HTML 200 untuk file yang tidak ada
    if (res.status === 200 && !looksLikeHtml(res.body)) {
      Object.assign(robots, { found: true, ...parseRobots(res.body) });
    }
  } catch {
    // tidak ada robots.txt
  }

  const queue = robots.sitemaps.length ? [...robots.sitemaps] : [`${origin}/sitemap.xml`];
  const urls = new Set<string>();
  const seen = new Set<string>();
  const errors: string[] = [];
  while (queue.length && seen.size < 10 && urls.size < limit) {
    const sm = queue.shift()!;
    if (seen.has(sm)) continue;
    seen.add(sm);
    try {
      const res = await fetcher(sm, { accept: "application/xml,text/xml" });
      if (res.status !== 200) {
        errors.push(`${sm}: HTTP ${res.status}`);
        continue;
      }
      if (!/<(urlset|sitemapindex)[\s>]/i.test(res.body)) {
        errors.push(`${sm}: bukan sitemap XML${looksLikeHtml(res.body) ? " (halaman HTML / soft 404)" : ""}`);
        continue;
      }
      const parsed = parseSitemap(res.body);
      parsed.urls.forEach((u) => urls.size < limit && urls.add(u));
      queue.push(...parsed.sitemaps);
    } catch (e) {
      errors.push(`${sm}: ${e instanceof Error ? e.message : e}`);
    }
  }
  return { robots, urls: [...urls], errors };
}

/** Crawl situs: halaman sitemap + BFS link internal, maksimal `maxPages`. */
export async function crawlSite(
  start: string,
  opts: { maxPages?: number; fetcher?: Fetcher; nap?: NapHints } = {},
): Promise<CrawlResult> {
  const fetcher = opts.fetcher ?? safeFetch;
  const maxPages = Math.min(Math.max(opts.maxPages ?? 30, 1), 100);
  const startUrl = toUrl(start);
  const origin = startUrl.origin;
  const host = startUrl.hostname;

  const { robots, urls: sitemapUrls } = await fetchSitemapUrls(origin, fetcher);
  const sitemapKeys = new Set(sitemapUrls.map(urlKey));

  const pages: CrawledPage[] = [];
  const referrers = new Map<string, Set<string>>();
  const visited = new Set<string>();
  const crawledFinal = new Set<string>();
  // Normalisasi (mis. "https://a.id" == "https://a.id/") agar tidak di-crawl dua kali
  const queue: string[] = [startUrl.toString(), ...sitemapUrls]
    .map((u) => normalizeLink(u, origin))
    .filter((u): u is string => !!u);

  while (queue.length && pages.length < maxPages) {
    const batch: string[] = [];
    while (queue.length && batch.length < 4 && pages.length + batch.length < maxPages) {
      const next = queue.shift()!;
      if (visited.has(next)) continue;
      visited.add(next);
      batch.push(next);
    }

    const results = await mapLimit(batch, 4, async (url): Promise<CrawledPage> => {
      const inSitemap = sitemapKeys.has(urlKey(url));
      try {
        const res = await fetcher(url);
        const isHtml = (res.headers["content-type"] ?? "").includes("html");
        const analysis =
          res.status === 200 && isHtml ? analyzeHtml(res.body, res.finalUrl, opts.nap) : null;
        return {
          url,
          finalUrl: res.finalUrl,
          status: res.status,
          redirected: res.redirects.length > 0,
          ms: res.ms,
          inSitemap,
          analysis,
        };
      } catch (e) {
        return {
          url,
          finalUrl: url,
          status: 0,
          redirected: false,
          ms: 0,
          inSitemap,
          analysis: null,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    });

    for (const page of results) {
      // Redirect ke halaman yang sudah di-crawl (mis. non-www → www): jangan dianalisis dua kali
      const finalKey = urlKey(page.finalUrl);
      if (crawledFinal.has(finalKey)) page.analysis = null;
      crawledFinal.add(finalKey);
      visited.add(page.finalUrl);
      pages.push(page);

      for (const link of page.analysis?.internalLinks ?? []) {
        const u = new URL(link);
        if (!sameSite(u.hostname, host) || SKIP_EXT.test(u.pathname)) continue;
        // URL berparameter (?voucher=, ?class=) hanya di-crawl bila ada di sitemap
        if (u.search && !sitemapKeys.has(urlKey(link))) continue;
        if (!referrers.has(link)) referrers.set(link, new Set());
        referrers.get(link)!.add(page.url);
        if (!visited.has(link)) queue.push(link);
      }
    }
  }

  const brokenLinks: CrawlResult["brokenLinks"] = [];
  for (const page of pages) {
    if (page.status >= 400 || page.status === 0) {
      for (const from of referrers.get(page.url) ?? []) {
        brokenLinks.push({ from, to: page.url, status: page.status });
      }
    }
  }

  return {
    startUrl: startUrl.toString(),
    robotsTxt: robots,
    sitemapUrls,
    pages,
    brokenLinks,
    truncated: queue.some((u) => !visited.has(u)),
  };
}

const WEIGHT: Record<Severity, number> = { high: 8, medium: 3, low: 1 };

/** Gabungkan isu per halaman + isu lintas halaman menjadi daftar berprioritas & skor 0–100. */
export function summarizeAudit(crawl: CrawlResult): AuditSummary {
  const issues = new Map<string, AuditIssue>();
  const add = (code: string, severity: Severity, message: string, url: string) => {
    const existing = issues.get(code);
    if (existing) {
      if (!existing.urls.includes(url)) existing.urls.push(url);
    } else {
      issues.set(code, { code, severity, message, urls: [url] });
    }
  };

  const okPages = crawl.pages.filter((p) => p.analysis);
  for (const page of okPages) {
    for (const issue of page.analysis!.issues) add(issue.code, issue.severity, issue.message, page.url);
  }

  // Isu lintas halaman
  const byTitle = new Map<string, string[]>();
  const byDesc = new Map<string, string[]>();
  for (const page of okPages) {
    const a = page.analysis!;
    // Halaman noindex atau yang canonical-nya ke URL lain bukan duplikat bagi Google
    if (a.noindex || (a.canonical && urlKey(a.canonical) !== urlKey(page.finalUrl))) continue;
    if (a.title) byTitle.set(a.title, [...(byTitle.get(a.title) ?? []), page.url]);
    if (a.metaDescription)
      byDesc.set(a.metaDescription, [...(byDesc.get(a.metaDescription) ?? []), page.url]);
  }
  for (const [title, urls] of byTitle) {
    if (urls.length > 1) urls.forEach((u) => add("title_duplicate", "medium", `Title duplikat: "${title}"`, u));
  }
  for (const [, urls] of byDesc) {
    if (urls.length > 1) urls.forEach((u) => add("description_duplicate", "medium", "Meta description duplikat.", u));
  }

  for (const page of crawl.pages) {
    if (page.status >= 500 || page.status === 0)
      add("server_error", "high", "Halaman error 5xx / gagal diambil.", page.url);
    else if (page.status >= 400) add("client_error", "high", "Halaman 4xx.", page.url);

    if (page.inSitemap) {
      if (page.redirected) add("sitemap_redirect", "medium", "URL di sitemap melakukan redirect.", page.url);
      if (page.status >= 400) add("sitemap_error", "high", "URL di sitemap error.", page.url);
      if (page.analysis?.noindex) add("sitemap_noindex", "high", "URL di sitemap diberi noindex.", page.url);
      const canonical = page.analysis?.canonical;
      if (canonical && urlKey(canonical) !== urlKey(page.finalUrl))
        add("sitemap_canonicalized", "medium", "URL di sitemap punya canonical ke URL lain.", page.url);
    } else if (page.analysis && !page.analysis.noindex && !page.redirected) {
      add("not_in_sitemap", "low", "Halaman terindeks tetapi tidak ada di sitemap.", page.url);
    }
  }

  // URL ganda di sitemap (mis. dengan & tanpa trailing slash)
  const sitemapCount = new Map<string, string[]>();
  for (const u of crawl.sitemapUrls) {
    const key = urlKey(u);
    sitemapCount.set(key, [...(sitemapCount.get(key) ?? []), u]);
  }
  for (const [, urls] of sitemapCount) {
    if (urls.length > 1)
      urls.forEach((u) => add("sitemap_duplicate", "medium", "URL ganda di sitemap (beda trailing slash / query).", u));
  }

  if (crawl.brokenLinks.length) {
    for (const b of crawl.brokenLinks) add("broken_internal_link", "high", "Link internal ke halaman error.", `${b.from} → ${b.to}`);
  }
  if (!crawl.robotsTxt.found) add("robots_missing", "low", "robots.txt tidak ditemukan.", crawl.startUrl);
  if (crawl.robotsTxt.disallowAll) add("robots_disallow_all", "high", "robots.txt memblokir seluruh situs.", crawl.startUrl);
  if (crawl.sitemapUrls.length === 0) add("sitemap_missing", "medium", "Sitemap tidak ditemukan / kosong.", crawl.startUrl);

  const sorted = [...issues.values()].sort(
    (a, b) => WEIGHT[b.severity] - WEIGHT[a.severity] || b.urls.length - a.urls.length,
  );

  // Skor heuristik: potongan per jenis isu, diperberat bila banyak halaman terdampak
  const total = Math.max(crawl.pages.length, 1);
  const penalty = sorted.reduce(
    (sum, i) => sum + WEIGHT[i.severity] * (0.5 + 0.5 * Math.min(i.urls.length / total, 1)),
    0,
  );
  const timed = crawl.pages.filter((p) => p.ms > 0);

  return {
    score: Math.max(0, Math.round(100 - penalty)),
    stats: {
      crawled: crawl.pages.length,
      ok: okPages.length,
      redirects: crawl.pages.filter((p) => p.redirected).length,
      errors: crawl.pages.filter((p) => p.status >= 400 || p.status === 0).length,
      sitemapUrls: crawl.sitemapUrls.length,
      avgResponseMs: timed.length ? Math.round(timed.reduce((s, p) => s + p.ms, 0) / timed.length) : 0,
    },
    issues: sorted,
  };
}
