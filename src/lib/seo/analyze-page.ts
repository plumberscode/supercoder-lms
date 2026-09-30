import { parse, type HTMLElement } from "node-html-parser";
import { countWords, htmlToText } from "@/lib/blog/text";

export type Severity = "high" | "medium" | "low";

export type PageIssue = { code: string; severity: Severity; message: string };

export type PageAnalysis = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  noindex: boolean;
  lang: string | null;
  hasViewport: boolean;
  h1: string[];
  h2: string[];
  h3Count: number;
  wordCount: number;
  images: number;
  imagesWithoutAlt: number;
  internalLinks: string[];
  externalLinks: string[];
  jsonLdTypes: string[];
  og: { title: string | null; description: string | null; image: string | null };
  nap?: { phone: boolean; address: boolean; city: boolean };
  issues: PageIssue[];
};

export type NapHints = { phones: string[]; address: string; city: string };

const clean = (s: string | undefined | null) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t || null;
};

function meta(root: HTMLElement, selector: string): string | null {
  return clean(root.querySelector(selector)?.getAttribute("content"));
}

function collectTypes(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  if (typeof type === "string") out.add(type);
  if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && out.add(t));
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") collectTypes(value, out);
  }
}

/** URL absolut tanpa fragment; null bila bukan http(s). */
export function normalizeLink(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export const sameSite = (a: string, b: string) =>
  a.replace(/^www\./, "") === b.replace(/^www\./, "");

const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** Analisis on-page dari HTML mentah (tanpa menjalankan JavaScript). */
export function analyzeHtml(html: string, pageUrl: string, nap?: NapHints): PageAnalysis {
  const root = parse(html, { comment: false });
  const host = new URL(pageUrl).hostname;

  const title = clean(root.querySelector("title")?.text);
  const metaDescription = meta(root, 'meta[name="description"]');
  const canonicalHref = root.querySelector('link[rel="canonical"]')?.getAttribute("href");
  const canonical = canonicalHref ? normalizeLink(canonicalHref, pageUrl) : null;
  const robots = meta(root, 'meta[name="robots"]');
  const noindex = /noindex/i.test(robots ?? "");

  const h1 = root.querySelectorAll("h1").map((h) => clean(h.text) ?? "").filter(Boolean);
  const h2 = root.querySelectorAll("h2").map((h) => clean(h.text) ?? "").filter(Boolean);
  const h3Count = root.querySelectorAll("h3").length;

  const body = root.querySelector("body");
  const text = htmlToText(body ? body.innerHTML : html);
  const wordCount = countWords(text);

  const imgs = root.querySelectorAll("img");
  const imagesWithoutAlt = imgs.filter((img) => !img.getAttribute("alt")?.trim()).length;

  const internal = new Set<string>();
  const external = new Set<string>();
  for (const a of root.querySelectorAll("a[href]")) {
    const link = normalizeLink(a.getAttribute("href") ?? "", pageUrl);
    if (!link) continue;
    (sameSite(new URL(link).hostname, host) ? internal : external).add(link);
  }

  const types = new Set<string>();
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      collectTypes(JSON.parse(script.rawText), types);
    } catch {
      types.add("(JSON-LD tidak valid)");
    }
  }

  const analysis: PageAnalysis = {
    url: pageUrl,
    title,
    metaDescription,
    canonical,
    robots,
    noindex,
    lang: clean(root.querySelector("html")?.getAttribute("lang")),
    hasViewport: !!root.querySelector('meta[name="viewport"]'),
    h1,
    h2: h2.slice(0, 30),
    h3Count,
    wordCount,
    images: imgs.length,
    imagesWithoutAlt,
    internalLinks: [...internal],
    externalLinks: [...external],
    jsonLdTypes: [...types],
    og: {
      title: meta(root, 'meta[property="og:title"]'),
      description: meta(root, 'meta[property="og:description"]'),
      image: meta(root, 'meta[property="og:image"]'),
    },
    issues: [],
  };

  if (nap) {
    const lowerText = text.toLowerCase();
    const pageDigits = digitsOnly(html);
    analysis.nap = {
      phone: nap.phones.some((p) => {
        const d = digitsOnly(p).replace(/^62/, "");
        return d.length > 5 && pageDigits.includes(d);
      }),
      address: !!nap.address && lowerText.includes(nap.address.toLowerCase()),
      city: !!nap.city && lowerText.includes(nap.city.toLowerCase()),
    };
  }

  analysis.issues = pageIssues(analysis);
  return analysis;
}

function pageIssues(p: PageAnalysis): PageIssue[] {
  const issues: PageIssue[] = [];
  const add = (code: string, severity: Severity, message: string) =>
    issues.push({ code, severity, message });

  if (!p.title) add("title_missing", "high", "Tag <title> tidak ada.");
  else if (p.title.length > 65) add("title_long", "low", `Title ${p.title.length} karakter (ideal ≤ 60).`);
  else if (p.title.length < 20) add("title_short", "medium", `Title hanya ${p.title.length} karakter.`);

  if (!p.metaDescription) add("description_missing", "medium", "Meta description tidak ada.");
  else if (p.metaDescription.length > 165)
    add("description_long", "low", `Meta description ${p.metaDescription.length} karakter (ideal 120–160).`);
  else if (p.metaDescription.length < 70)
    add("description_short", "low", `Meta description hanya ${p.metaDescription.length} karakter.`);

  if (p.h1.length === 0) add("h1_missing", "high", "Tidak ada H1.");
  if (p.h1.length > 1) add("h1_multiple", "low", `Ada ${p.h1.length} H1.`);
  if (!p.canonical) add("canonical_missing", "medium", "Tidak ada link canonical.");
  if (p.noindex) add("noindex", "high", "Halaman diberi noindex.");
  if (!p.hasViewport) add("viewport_missing", "high", "Tidak ada meta viewport (tidak mobile-friendly).");
  if (!p.lang) add("lang_missing", "low", "Atribut lang di <html> tidak ada.");
  if (p.wordCount < 300) add("thin_content", "medium", `Konten tipis: ${p.wordCount} kata.`);
  if (p.imagesWithoutAlt > 0)
    add("img_alt_missing", "low", `${p.imagesWithoutAlt} dari ${p.images} gambar tanpa alt.`);
  if (p.jsonLdTypes.length === 0) add("schema_missing", "low", "Tidak ada structured data JSON-LD.");
  if (!p.og.image) add("og_image_missing", "low", "Tidak ada og:image.");
  return issues;
}
