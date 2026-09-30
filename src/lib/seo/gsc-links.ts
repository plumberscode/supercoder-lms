const bareDomain = (d: string) =>
  d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

/**
 * Parse CSV "Top linking sites" dari Google Search Console (Links → Export).
 * Kolom 1 = domain, kolom 2 = jumlah link; baris pertama header.
 */
export function parseGscLinksCsv(text: string): { domain: string; links: number }[] {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).slice(1);
  const out = new Map<string, number>();
  for (const row of rows) {
    const [rawDomain, rawLinks] = row.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    if (!rawDomain || !rawDomain.includes(".")) continue;
    const domain = bareDomain(rawDomain);
    out.set(domain, (out.get(domain) ?? 0) + (Number((rawLinks ?? "").replace(/\D/g, "")) || 0));
  }
  return [...out.entries()]
    .map(([domain, links]) => ({ domain, links }))
    .sort((a, b) => b.links - a.links);
}
