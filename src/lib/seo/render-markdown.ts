import { Marked, type Tokens } from "marked";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const safeHref = (href: string) => /^(https?:\/\/|\/(?!\/)|#)/i.test(href.trim());

/**
 * Markdown → HTML untuk output agent. Output LLM bisa memuat teks dari situs pihak
 * ketiga (prompt injection), jadi: HTML mentah di-escape, link hanya http(s)/relatif,
 * gambar dirender sebagai link teks.
 */
const md = new Marked({
  gfm: true,
  breaks: true,
  async: false,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text);
    },
    link(token: Tokens.Link) {
      const text = this.parser.parseInline(token.tokens);
      if (!safeHref(token.href)) return text;
      const external = /^https?:/i.test(token.href);
      return `<a href="${escapeHtml(token.href)}"${
        external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""
      }>${text}</a>`;
    },
    image(token: Tokens.Image) {
      const alt = escapeHtml(token.text || "gambar");
      return safeHref(token.href)
        ? `<a href="${escapeHtml(token.href)}" target="_blank" rel="noopener noreferrer nofollow">[${alt}]</a>`
        : `[${alt}]`;
    },
  },
});

export function renderAgentMarkdown(markdown: string): string {
  return md.parse(markdown) as string;
}
