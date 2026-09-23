import sanitizeHtml from "sanitize-html";
import { parse } from "node-html-parser";
import hljs from "highlight.js/lib/common";
import { SITE_URL } from "@/lib/site";
import { countWords, htmlToText, readingMinutes, slugify } from "./text";
import type { TocItem } from "./types";

/** Allowlist untuk HTML keluaran TipTap. Dipakai saat simpan dan saat render. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s",
      "a", "ul", "ol", "li", "blockquote", "pre", "code", "img", "figure",
      "figcaption", "table", "thead", "tbody", "tr", "th", "td", "colgroup",
      "col", "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      code: ["class"],
      span: ["class"],
    },
    allowedClasses: {
      code: ["language-*", "hljs"],
      span: ["hljs*"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
  });
}

const INTERNAL_HOSTS = new Set(
  [new URL(SITE_URL).host, "supercoder.id", "www.supercoder.id"].map((h) =>
    h.toLowerCase(),
  ),
);

function isInternalHref(href: string): boolean {
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    return INTERNAL_HOSTS.has(new URL(href).host.toLowerCase());
  } catch {
    return false;
  }
}

export type ProcessedArticle = {
  html: string;
  toc: TocItem[];
  wordCount: number;
  readingMinutes: number;
};

/**
 * Menyiapkan HTML artikel untuk dirender:
 * - sanitasi ulang (defense in depth)
 * - id/anchor untuk setiap H2/H3 + daftar isi
 * - link internal tanpa target, link eksternal _blank + noopener
 * - gambar lazy + fallback alt
 * - syntax highlighting untuk code block
 */
export function processArticleHtml(
  rawHtml: string,
  fallbackAlt = "",
): ProcessedArticle {
  // Default node-html-parser memperlakukan <pre> sebagai teks mentah; kita perlu <code> di dalamnya
  const root = parse(sanitizeArticleHtml(rawHtml), {
    blockTextElements: { script: true, style: true },
  });
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  for (const heading of root.querySelectorAll("h2, h3")) {
    const text = heading.text.trim();
    if (!text) continue;
    const base = slugify(text) || "bagian";
    let id = base;
    for (let i = 2; usedIds.has(id); i++) id = `${base}-${i}`;
    usedIds.add(id);
    heading.setAttribute("id", id);
    toc.push({ id, text, level: heading.tagName === "H2" ? 2 : 3 });
  }

  for (const link of root.querySelectorAll("a")) {
    const href = link.getAttribute("href") ?? "";
    if (isInternalHref(href)) {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    } else {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  }

  for (const img of root.querySelectorAll("img")) {
    if (!img.getAttribute("alt")?.trim()) img.setAttribute("alt", fallbackAlt);
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
  }

  for (const pre of root.querySelectorAll("pre")) {
    const code = pre.querySelector("code");
    if (!code) continue;
    const lang = /language-([\w-]+)/.exec(code.getAttribute("class") ?? "")?.[1];
    const source = code.text;
    const result =
      lang && hljs.getLanguage(lang)
        ? hljs.highlight(source, { language: lang })
        : hljs.highlightAuto(source);
    code.set_content(result.value);
    code.setAttribute("class", `hljs${lang ? ` language-${lang}` : ""}`);
  }

  const wordCount = countWords(htmlToText(root.toString()));

  return {
    html: root.toString(),
    toc,
    wordCount,
    readingMinutes: readingMinutes(wordCount),
  };
}
