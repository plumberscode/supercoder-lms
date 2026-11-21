/**
 * Formatter HTML ringan bergaya Prettier untuk menampilkan kode awal soal.
 *
 * - Elemen blok yang berisi elemen blok lain dipecah per baris dengan indentasi 2 spasi.
 * - Elemen yang isinya hanya teks/elemen inline dan muat dalam satu baris tetap satu baris.
 * - Isi <pre>, <textarea>, <script>, dan <style> tidak diubah (hanya diindentasi ulang
 *   untuk script/style).
 * - Jika struktur HTML tidak rapi (tag tidak ditutup / salah pasangan), teks asli
 *   dikembalikan apa adanya supaya makna kode tidak berubah.
 */

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "source", "track", "wbr",
]);

const INLINE = new Set([
  "a", "abbr", "b", "bdi", "bdo", "br", "button", "cite", "code", "data", "dfn",
  "em", "i", "img", "input", "kbd", "label", "mark", "q", "s", "samp", "select",
  "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr",
]);

const RAW = new Set(["script", "style", "pre", "textarea"]);

const INDENT = "  ";
const PRINT_WIDTH = 80;

type Node =
  | { type: "text"; value: string }
  | { type: "comment"; value: string }
  | { type: "doctype"; value: string }
  | {
      type: "element";
      name: string;
      attrs: string;
      children: Node[];
      raw?: string;
    };

class ParseError extends Error {}

function parseAttrs(src: string): string {
  const out: string[] = [];
  const re = /([^\s=\/]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    out.push(m[2] !== undefined ? `${m[1]}=${m[2]}` : m[1]);
  }
  return out.length ? " " + out.join(" ") : "";
}

function parse(html: string): Node[] {
  const root: Node[] = [];
  const stack: { name: string; children: Node[] }[] = [];
  const current = () => (stack.length ? stack[stack.length - 1].children : root);
  let i = 0;

  while (i < html.length) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      if (end === -1) throw new ParseError();
      current().push({ type: "comment", value: html.slice(i, end + 3) });
      i = end + 3;
      continue;
    }
    if (html.startsWith("<!", i)) {
      const end = html.indexOf(">", i);
      if (end === -1) throw new ParseError();
      current().push({ type: "doctype", value: html.slice(i, end + 1) });
      i = end + 1;
      continue;
    }
    const close = /^<\/([a-zA-Z][\w:-]*)\s*>/.exec(html.slice(i));
    if (close) {
      const name = close[1].toLowerCase();
      const top = stack.pop();
      if (!top || top.name !== name) throw new ParseError();
      i += close[0].length;
      continue;
    }
    const open = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(i));
    if (open) {
      const name = open[1].toLowerCase();
      // Cari akhir tag dengan memperhatikan tanda kutip pada atribut.
      let j = i + open[0].length;
      let quote: string | null = null;
      while (j < html.length) {
        const c = html[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === ">") {
          break;
        }
        j++;
      }
      if (j >= html.length) throw new ParseError();
      let attrSrc = html.slice(i + open[0].length, j);
      const selfClosing = /\/\s*$/.test(attrSrc);
      if (selfClosing) attrSrc = attrSrc.replace(/\/\s*$/, "");
      const el: Node = {
        type: "element",
        name,
        attrs: parseAttrs(attrSrc),
        children: [],
      };
      current().push(el);
      i = j + 1;
      if (VOID.has(name) || selfClosing) continue;
      if (RAW.has(name)) {
        const endIdx = html.toLowerCase().indexOf(`</${name}`, i);
        if (endIdx === -1) throw new ParseError();
        el.raw = html.slice(i, endIdx);
        const gt = html.indexOf(">", endIdx);
        if (gt === -1) throw new ParseError();
        i = gt + 1;
        continue;
      }
      stack.push({ name, children: el.children });
      continue;
    }
    // Teks biasa sampai tag berikutnya.
    let next = html.indexOf("<", i + 1);
    if (next === -1) next = html.length;
    current().push({ type: "text", value: html.slice(i, next) });
    i = next;
  }

  if (stack.length) throw new ParseError();
  return root;
}

function isInline(node: Node): boolean {
  if (node.type === "text") return true;
  if (node.type !== "element") return false;
  if (!INLINE.has(node.name)) return false;
  if (node.raw !== undefined) return node.name === "textarea";
  return node.children.every(isInline);
}

function openTag(el: Extract<Node, { type: "element" }>) {
  return `<${el.name}${el.attrs}>`;
}

/** Cetak node inline dalam satu baris (spasi berurutan dipadatkan). */
function inlineString(node: Node): string {
  if (node.type === "text") return node.value.replace(/\s+/g, " ");
  if (node.type !== "element") return node.value;
  if (VOID.has(node.name)) return openTag(node);
  if (node.raw !== undefined) return `${openTag(node)}${node.raw}</${node.name}>`;
  return `${openTag(node)}${node.children.map(inlineString).join("")}</${node.name}>`;
}

function reindentRaw(raw: string, indent: string): string[] {
  const lines = raw.replace(/^\s*\n/, "").replace(/\s+$/, "").split("\n");
  const nonEmpty = lines.filter((l) => l.trim());
  const minIndent = Math.min(
    ...nonEmpty.map((l) => (l.match(/^[ \t]*/) as RegExpMatchArray)[0].length),
  );
  return lines.map((l) => (l.trim() ? indent + l.slice(minIndent).trimEnd() : ""));
}

function printChildren(children: Node[], depth: number): string[] {
  const lines: string[] = [];
  const indent = INDENT.repeat(depth);
  let run: Node[] = [];

  const flush = () => {
    const text = run.map(inlineString).join("").trim();
    if (text) lines.push(indent + text);
    run = [];
  };

  for (const child of children) {
    if (isInline(child)) {
      run.push(child);
      continue;
    }
    flush();
    lines.push(...printNode(child, depth));
  }
  flush();
  return lines;
}

function printNode(node: Node, depth: number): string[] {
  const indent = INDENT.repeat(depth);
  if (node.type === "text") {
    const t = node.value.replace(/\s+/g, " ").trim();
    return t ? [indent + t] : [];
  }
  if (node.type === "comment" || node.type === "doctype") {
    return [indent + node.value.trim()];
  }

  const open = openTag(node);
  const close = `</${node.name}>`;
  if (VOID.has(node.name)) return [indent + open];

  if (node.raw !== undefined) {
    if (node.name === "pre" || node.name === "textarea") {
      return [indent + open + node.raw + close];
    }
    if (!node.raw.trim()) return [indent + open + close];
    return [indent + open, ...reindentRaw(node.raw, indent + INDENT), indent + close];
  }

  if (node.children.every(isInline)) {
    const content = node.children.map(inlineString).join("").trim();
    const oneLine = indent + open + content + close;
    if (!content || oneLine.length <= PRINT_WIDTH) return [oneLine];
    return [indent + open, indent + INDENT + content, indent + close];
  }

  return [indent + open, ...printChildren(node.children, depth + 1), indent + close];
}

export function formatHtml(html: string): string {
  if (!html || !html.trim()) return html;
  try {
    const tree = parse(html);
    return printChildren(tree, 0).join("\n");
  } catch {
    return html;
  }
}
