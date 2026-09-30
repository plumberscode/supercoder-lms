import type { SerpResult } from "./providers/types";

const bare = (d: string) => d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

/** true bila `host` adalah `domain` atau subdomainnya. */
export function matchesDomain(host: string, domain: string): boolean {
  const h = bare(host);
  const d = bare(domain);
  return h === d || h.endsWith(`.${d}`);
}

export type RankingRow = {
  keyword: string;
  ourPosition: number | null;
  competitors: Record<string, number | null>;
  bestCompetitor: { domain: string; position: number } | null;
  status: "missing" | "behind" | "winning" | "untapped";
};

/**
 * Matriks ranking keyword × domain dari hasil SERP.
 * - missing: kompetitor ada di hasil, kita tidak
 * - behind: kita ada, tapi ada kompetitor di atas kita
 * - winning: kita di atas semua kompetitor
 * - untapped: kita & kompetitor sama-sama tidak ada
 */
export function rankingGap(serps: SerpResult[], ourDomain: string, competitors: string[]): RankingRow[] {
  const positionOf = (serp: SerpResult, domain: string) =>
    serp.organic.find((o) => matchesDomain(o.domain, domain))?.position ?? null;

  return serps.map((serp) => {
    const ourPosition = positionOf(serp, ourDomain);
    const comp: Record<string, number | null> = {};
    let best: RankingRow["bestCompetitor"] = null;
    for (const c of competitors) {
      const pos = positionOf(serp, c);
      comp[bare(c)] = pos;
      if (pos !== null && (!best || pos < best.position)) best = { domain: bare(c), position: pos };
    }

    let status: RankingRow["status"];
    if (ourPosition === null) status = best ? "missing" : "untapped";
    else status = best && best.position < ourPosition ? "behind" : "winning";

    return { keyword: serp.query, ourPosition, competitors: comp, bestCompetitor: best, status };
  });
}

// Stopword Indonesia + Inggris yang sering muncul di judul/URL
const STOPWORDS = new Set(
  `yang dan di ke dari untuk dengan pada ini itu atau dalam adalah akan bisa juga karena oleh sebagai tidak ada kami kamu anda kita
  cara apa bagaimana kenapa mengapa lebih paling semua para the a an of to in for and or on with by is are at from your our
  www com id html php index page blog tag category kategori artikel post news home beranda https http amp`
    .split(/\s+/)
    .filter(Boolean),
);

/** Token dari teks bebas atau slug URL. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/[^/\s]+/g, " ")
    .replace(/[^a-z0-9À-ɏ]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/** Frasa 1–3 kata dari satu teks (tanpa melintasi batas kalimat/segmen). */
export function phrases(text: string): string[] {
  const out = new Set<string>();
  for (const segment of text.split(/[|\-–—:/,.?!()]+/)) {
    const tokens = tokenize(segment);
    for (let n = 1; n <= 3; n++) {
      for (let i = 0; i + n <= tokens.length; i++) out.add(tokens.slice(i, i + n).join(" "));
    }
  }
  return [...out];
}

export type TopicGapRow = { phrase: string; competitors: string[]; mentions: number };

/**
 * Topik (frasa dari judul, heading, slug URL) yang dipakai kompetitor tapi tidak muncul
 * di situs kita. Diurutkan dari yang dipakai paling banyak kompetitor.
 */
export function topicGap(
  ours: string[],
  competitors: Record<string, string[]>,
  opts: { minCompetitors?: number; limit?: number } = {},
): TopicGapRow[] {
  const ourPhrases = new Set(ours.flatMap(phrases));
  const ourTokens = new Set(ours.flatMap(tokenize));
  const rows = new Map<string, { competitors: Set<string>; mentions: number }>();

  for (const [domain, texts] of Object.entries(competitors)) {
    for (const text of texts) {
      for (const phrase of phrases(text)) {
        if (ourPhrases.has(phrase)) continue;
        // Frasa 1 kata yang sudah kita pakai di mana pun bukan gap
        if (!phrase.includes(" ") && ourTokens.has(phrase)) continue;
        const row = rows.get(phrase) ?? { competitors: new Set<string>(), mentions: 0 };
        row.competitors.add(domain);
        row.mentions++;
        rows.set(phrase, row);
      }
    }
  }

  const minCompetitors = opts.minCompetitors ?? 1;
  return [...rows.entries()]
    .filter(([p, r]) => r.competitors.size >= minCompetitors && (p.includes(" ") || r.mentions >= 2))
    .map(([phrase, r]) => ({ phrase, competitors: [...r.competitors], mentions: r.mentions }))
    .sort(
      (a, b) =>
        b.competitors.length - a.competitors.length ||
        b.phrase.split(" ").length - a.phrase.split(" ").length ||
        b.mentions - a.mentions,
    )
    .slice(0, opts.limit ?? 60);
}

/** Teks kasar dari slug URL: /kursus-coding-di-balikpapan → "kursus coding di balikpapan". */
export function slugText(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname).replace(/[/_-]+/g, " ").trim();
  } catch {
    return "";
  }
}
