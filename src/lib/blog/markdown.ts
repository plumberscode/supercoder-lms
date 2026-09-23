import { marked } from "marked";

const MARKDOWN_PATTERNS = [
  /^#{1,6}\s+\S/m, // heading
  /^```/m, // code fence
  /^\s*[-*+]\s+\S/m, // bullet list
  /^\s*\d+\.\s+\S/m, // numbered list
  /^\|.+\|\s*$/m, // tabel
  /^>\s+\S/m, // blockquote
  /\*\*[^*\n]+\*\*/, // tebal
  /!?\[[^\]\n]*\]\([^)\s]+\)/, // link / gambar
];

/** Heuristik: apakah teks yang di-paste kemungkinan besar Markdown. */
export function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_PATTERNS.some((re) => re.test(text));
}

/**
 * Markdown → HTML yang cocok untuk editor artikel.
 * - frontmatter YAML dibuang
 * - "# Judul" di baris pertama diambil sebagai H1 (dipakai untuk field headline)
 * - heading dinormalisasi ke H2/H3 (H1 = headline halaman)
 *
 * Dipakai di browser (editor), jadi sengaja tidak memuat sanitize-html. Tag berbahaya
 * dibuang oleh skema TipTap, dan server menyanitasi ulang saat simpan & render.
 */
export function markdownToArticle(markdown: string): { html: string; h1: string | null } {
  let md = markdown.replace(/\r\n?/g, "\n").trim();

  md = md.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();

  let h1: string | null = null;
  const firstLine = /^#\s+(.+?)\s*#*\s*(\n|$)/.exec(md);
  if (firstLine) {
    h1 = firstLine[1].replace(/[*_`]/g, "").trim();
    md = md.slice(firstLine[0].length).trim();
  }

  const raw = marked.parse(md, { gfm: true, breaks: false, async: false }) as string;

  const html = raw
    .replace(/<(\/?)h1(\s|>)/g, "<$1h2$2")
    .replace(/<(\/?)h[4-6](\s|>)/g, "<$1h3$2");

  return { html, h1 };
}
