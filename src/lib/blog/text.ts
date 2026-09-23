/** Slug URL: huruf kecil, tanpa simbol, spasi → "-" (sama dengan Falya). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** Teks polos dari HTML (untuk hitung kata, excerpt otomatis, RSS). */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|h[1-6]|li|pre|blockquote|tr)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ringkasan maksimal `max` karakter, dipotong di batas kata. */
export function cleanExcerpt(html: string, max = 155): string {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

export function countWords(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** Estimasi waktu baca (200 kata/menit), minimal 1 menit. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function formatDateId(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}
