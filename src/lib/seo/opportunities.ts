/** Baris Search Analytics dari Google Search Console. */
export type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

/** Perkiraan CTR organik per posisi (kurva industri, kasar). */
export function expectedCtr(position: number): number {
  const curve = [0.28, 0.15, 0.11, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02];
  const p = Math.max(1, Math.round(position));
  return p <= 10 ? curve[p - 1] : p <= 20 ? 0.01 : 0.003;
}

export type Opportunity = {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  /** Tambahan klik/bulan yang mungkin bila naik ke posisi 3 (atau CTR normal). */
  potentialClicks: number;
  reason: string;
};

/**
 * Peluang dari data GSC (dimensi [query, page] atau [query]):
 * - striking distance: posisi 4–20 dengan impresi cukup → dorong ke top 3
 * - low CTR: sudah top 5 tapi CTR < separuh perkiraan → perbaiki title/description
 */
export function findOpportunities(
  rows: GscRow[],
  opts: { minImpressions?: number; periodDays?: number } = {},
): { strikingDistance: Opportunity[]; lowCtr: Opportunity[] } {
  const minImpressions = opts.minImpressions ?? 10;
  const monthly = 30 / (opts.periodDays ?? 28);
  const toOpp = (r: GscRow, target: number, reason: string): Opportunity => ({
    query: r.keys[0],
    page: r.keys[1] ?? null,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Number(r.ctr.toFixed(4)),
    position: Number(r.position.toFixed(1)),
    potentialClicks: Math.max(0, Math.round((r.impressions * target - r.clicks) * monthly)),
    reason,
  });

  const eligible = rows.filter((r) => r.impressions >= minImpressions);

  const strikingDistance = eligible
    .filter((r) => r.position > 3.5 && r.position <= 20)
    .map((r) => toOpp(r, expectedCtr(3), `Posisi ${r.position.toFixed(1)} — dekat ke halaman 1/top 3`))
    .sort((a, b) => b.potentialClicks - a.potentialClicks);

  const lowCtr = eligible
    .filter((r) => r.position <= 5 && r.ctr < expectedCtr(r.position) * 0.5)
    .map((r) =>
      toOpp(
        r,
        expectedCtr(r.position),
        `CTR ${(r.ctr * 100).toFixed(1)}% vs normal ±${(expectedCtr(r.position) * 100).toFixed(0)}% di posisi ${r.position.toFixed(1)}`,
      ),
    )
    .sort((a, b) => b.potentialClicks - a.potentialClicks);

  return { strikingDistance, lowCtr };
}
