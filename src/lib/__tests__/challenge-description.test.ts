import { describe, expect, it } from "vitest";
import {
  descriptionToPlainText,
  isEmptyDescription,
  prepareChallengeDescription,
} from "../challenge-description";
import { isRichDescription } from "@/components/ChallengeDescription";

describe("isRichDescription", () => {
  it("mengenali HTML TipTap", () => {
    expect(isRichDescription("<h1>Judul</h1><p>isi</p>")).toBe(true);
    expect(isRichDescription("<p>isi</p>")).toBe(true);
  });
  it("teks polos lama, termasuk yang menyebut tag, tidak dianggap HTML", () => {
    expect(isRichDescription("Buat fungsi tambah\n\nContoh: tambah(2,3)")).toBe(false);
    expect(isRichDescription("<div> adalah elemen blok")).toBe(false);
  });
});

describe("prepareChallengeDescription", () => {
  it("membuang script dan atribut event", () => {
    const out = prepareChallengeDescription(
      '<p onclick="x()">Hai<script>alert(1)</script><img src=x onerror=alert(1)></p>',
    );
    expect(out).not.toMatch(/script|onclick|onerror|<img/i);
    expect(out).toContain("Hai");
  });
  it("mempertahankan h1, bold, list, dan code block", () => {
    const html = "<h1>A</h1><p><strong>b</strong></p><ul><li>c</li></ul><pre><code>x</code></pre>";
    expect(prepareChallengeDescription(html)).toBe(html);
  });
  it("memblokir link javascript:", () => {
    expect(prepareChallengeDescription('<p><a href="javascript:alert(1)">x</a></p>')).not.toMatch(
      /javascript:/,
    );
  });
  it("teks polos tidak diubah", () => {
    expect(prepareChallengeDescription("a < b && c > d")).toBe("a < b && c > d");
  });
});

describe("isEmptyDescription / descriptionToPlainText", () => {
  it("menganggap <p></p> kosong", () => {
    expect(isEmptyDescription("<p></p>")).toBe(true);
    expect(isEmptyDescription("  ")).toBe(true);
    expect(isEmptyDescription("<p>x</p>")).toBe(false);
  });
  it("mengubah HTML jadi teks untuk AI", () => {
    expect(descriptionToPlainText("<h2>Soal</h2><p>Buat <strong>fungsi</strong></p>")).toBe(
      "Soal Buat fungsi",
    );
  });
});
