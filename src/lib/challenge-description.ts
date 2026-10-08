import sanitizeHtml from "sanitize-html";
import { isRichDescription } from "@/components/ChallengeDescription";
import { htmlToText } from "@/lib/blog/text";

/** Allowlist HTML deskripsi soal (keluaran TipTap). Berbeda dari blog: H1 diizinkan. */
export function sanitizeChallengeHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s",
      "a", "ul", "ol", "li", "blockquote", "pre", "code", "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      code: ["class"],
    },
    allowedClasses: { code: ["language-*"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}

/** Sanitasi HTML bila rich text; teks polos lama dibiarkan apa adanya. */
export function prepareChallengeDescription(description: string): string {
  return isRichDescription(description) ? sanitizeChallengeHtml(description) : description;
}

/** True bila deskripsi tidak punya teks (mis. TipTap kosong menghasilkan `<p></p>`). */
export function isEmptyDescription(description: string): boolean {
  return isRichDescription(description)
    ? htmlToText(description).length === 0
    : description.trim().length === 0;
}

/** Versi teks polos untuk prompt AI (tanpa tag HTML). */
export function descriptionToPlainText(description: string): string {
  return isRichDescription(description) ? htmlToText(description) : description;
}
