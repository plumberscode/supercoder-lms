import { describe, it, expect } from "vitest";
import { formatHtml } from "../format-html";

describe("formatHtml", () => {
  it("memecah elemen blok bersarang dengan indentasi", () => {
    expect(formatHtml('<div class="kotak"><div class="avatar">H</div></div>')).toBe(
      ['<div class="kotak">', '  <div class="avatar">H</div>', "</div>"].join("\n"),
    );
  });

  it("mempertahankan isi inline dalam satu baris", () => {
    expect(formatHtml("<p>Halo <b>dunia</b>!</p>")).toBe("<p>Halo <b>dunia</b>!</p>");
  });

  it("menangani elemen void, komentar, dan doctype", () => {
    expect(
      formatHtml('<!DOCTYPE html><body><!-- x --><img src="a.png"><ul><li>1</li><li>2</li></ul></body>'),
    ).toBe(
      [
        "<!DOCTYPE html>",
        "<body>",
        "  <!-- x -->",
        '  <img src="a.png">',
        "  <ul>",
        "    <li>1</li>",
        "    <li>2</li>",
        "  </ul>",
        "</body>",
      ].join("\n"),
    );
  });

  it("idempoten untuk HTML yang sudah rapi", () => {
    const once = formatHtml('<div class="kotak"><div class="avatar">H</div><p>Teks</p></div>');
    expect(formatHtml(once)).toBe(once);
  });

  it("mengindentasi ulang isi script tanpa mengubahnya", () => {
    expect(formatHtml("<div><script>\n    let a = 1;\n    if (a) {\n      a++;\n    }\n</script></div>")).toBe(
      ["<div>", "  <script>", "    let a = 1;", "    if (a) {", "      a++;", "    }", "  </script>", "</div>"].join("\n"),
    );
  });

  it("mengembalikan teks asli bila struktur tidak valid", () => {
    const bad = "<div><p>tidak ditutup</div>";
    expect(formatHtml(bad)).toBe(bad);
    expect(formatHtml("")).toBe("");
  });
});
