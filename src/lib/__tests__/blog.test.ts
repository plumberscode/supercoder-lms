import { describe, expect, it } from "vitest";
import { cleanExcerpt, readingMinutes, slugify } from "@/lib/blog/text";
import { processArticleHtml, sanitizeArticleHtml } from "@/lib/blog/html";
import { looksLikeMarkdown, markdownToArticle } from "@/lib/blog/markdown";

describe("slugify", () => {
  it("membuat slug URL yang bersih", () => {
    expect(slugify("  Belajar Coding: HTML & CSS untuk Pemula!  ")).toBe(
      "belajar-coding-html-css-untuk-pemula",
    );
    expect(slugify("Café — Résumé")).toBe("cafe-resume");
  });
});

describe("cleanExcerpt", () => {
  it("menghapus HTML dan memotong di batas kata", () => {
    const html = `<p>${"kata ".repeat(60)}</p>`;
    const result = cleanExcerpt(html, 50);
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("<");
  });
});

describe("readingMinutes", () => {
  it("minimal 1 menit, 200 kata per menit", () => {
    expect(readingMinutes(10)).toBe(1);
    expect(readingMinutes(1000)).toBe(5);
  });
});

describe("sanitizeArticleHtml", () => {
  it("membuang script dan atribut event", () => {
    const html = sanitizeArticleHtml(
      '<p onclick="alert(1)">Hai</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
  });
});

describe("processArticleHtml", () => {
  const html = `
    <h2>Apa itu HTML?</h2><p>Teks</p>
    <h3>Tag dasar</h3>
    <h2>Apa itu HTML?</h2>
    <p><a href="/daftar" target="_blank">Daftar</a> dan <a href="https://developer.mozilla.org">MDN</a></p>
    <img src="https://res.cloudinary.com/demo/image/upload/x.jpg">
    <pre><code class="language-javascript">const a = 1 &lt; 2;</code></pre>`;

  const result = processArticleHtml(html, "Judul artikel");

  it("memberi id unik pada heading dan menyusun TOC", () => {
    expect(result.toc).toEqual([
      { id: "apa-itu-html", text: "Apa itu HTML?", level: 2 },
      { id: "tag-dasar", text: "Tag dasar", level: 3 },
      { id: "apa-itu-html-2", text: "Apa itu HTML?", level: 2 },
    ]);
    expect(result.html).toContain('id="apa-itu-html-2"');
  });

  it("link internal tanpa _blank, eksternal dengan _blank + noopener", () => {
    expect(result.html).toContain('<a href="/daftar">Daftar</a>');
    expect(result.html).toMatch(/href="https:\/\/developer\.mozilla\.org" target="_blank" rel="noopener noreferrer"/);
  });

  it("gambar mendapat fallback alt dan lazy loading", () => {
    expect(result.html).toMatch(/<img[^>]*alt="Judul artikel"/);
    expect(result.html).toMatch(/<img[^>]*loading="lazy"/);
  });

  it("code block di-highlight tanpa kehilangan escaping", () => {
    expect(result.html).toContain('class="hljs language-javascript"');
    expect(result.html).toContain("hljs-keyword");
    expect(result.html).toContain("&lt;");
  });

  it("menghitung waktu baca", () => {
    expect(result.readingMinutes).toBe(1);
    expect(result.wordCount).toBeGreaterThan(5);
  });
});

describe("looksLikeMarkdown", () => {
  it("mengenali pola Markdown umum", () => {
    expect(looksLikeMarkdown("# Judul\n\nIsi")).toBe(true);
    expect(looksLikeMarkdown("Intro\n\n- satu\n- dua")).toBe(true);
    expect(looksLikeMarkdown("```js\nconst a = 1;\n```")).toBe(true);
    expect(looksLikeMarkdown("| a | b |\n|---|---|\n| 1 | 2 |")).toBe(true);
    expect(looksLikeMarkdown("Lihat [MDN](https://developer.mozilla.org)")).toBe(true);
  });

  it("tidak menganggap paragraf biasa sebagai Markdown", () => {
    expect(looksLikeMarkdown("Belajar coding itu seru. Ayo mulai hari ini!")).toBe(false);
  });
});

describe("markdownToArticle", () => {
  const md = `---
title: abaikan
---

# Cara Belajar HTML untuk Pemula

Paragraf **pembuka**.

## Apa itu HTML?

#### Detail kecil

\`\`\`js
const a = 1;
\`\`\`

| Tag | Fungsi |
|-----|--------|
| p   | paragraf |
`;

  const { html, h1 } = markdownToArticle(md);

  it("mengambil # Judul sebagai H1 dan membuangnya dari konten", () => {
    expect(h1).toBe("Cara Belajar HTML untuk Pemula");
    expect(html).not.toContain("Cara Belajar HTML untuk Pemula");
    expect(html).not.toContain("<h1");
  });

  it("membuang frontmatter", () => {
    expect(html).not.toContain("abaikan");
  });

  it("menormalisasi heading ke H2/H3", () => {
    expect(html).toContain("<h2");
    expect(html).toContain("<h3");
    expect(html).not.toMatch(/<h4/);
  });

  it("mempertahankan bahasa code block dan tabel", () => {
    expect(html).toContain('class="language-js"');
    expect(html).toContain("<table>");
    expect(html).toContain("<strong>pembuka</strong>");
  });

  it("H1 kedua di tengah artikel diturunkan menjadi H2", () => {
    const r = markdownToArticle("Intro\n\n# Bagian Lain\n\nIsi");
    expect(r.h1).toBeNull();
    expect(r.html).toContain("<h2");
  });
});
