type Audit = {
  id: string;
  title: string;
  score: number | null;
  displayValue?: string;
  details?: { type?: string; overallSavingsMs?: number };
};

type PsiResponse = {
  lighthouseResult?: {
    categories?: Record<string, { score: number | null }>;
    audits?: Record<string, Audit>;
  };
  loadingExperience?: {
    overall_category?: string;
    metrics?: Record<string, { percentile: number; category: string }>;
  };
};

export type PageSpeedResult = {
  url: string;
  strategy: "mobile" | "desktop";
  scores: Record<string, number | null>;
  lab: Record<string, string | undefined>;
  field: {
    overall?: string;
    metrics: Record<string, { percentile: number; category: string }>;
  } | null;
  opportunities: { title: string; savingsMs: number }[];
};

const LAB_AUDITS = [
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "total-blocking-time",
  "first-contentful-paint",
  "speed-index",
];

/** Google PageSpeed Insights v5 (gratis; key opsional untuk kuota lebih besar). */
export async function runPageSpeed(
  url: string,
  strategy: "mobile" | "desktop",
): Promise<PageSpeedResult> {
  const params = new URLSearchParams({ url, strategy });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", c);
  }
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);

  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
    signal: AbortSignal.timeout(90_000),
  });
  if (res.status === 429) {
    throw new Error(
      process.env.PAGESPEED_API_KEY
        ? "Kuota PageSpeed Insights habis untuk hari ini (429). Coba lagi besok."
        : "Kuota PageSpeed Insights tanpa API key habis (429). Isi PAGESPEED_API_KEY (gratis, dibuat di Google Cloud project Supercoder SEO).",
    );
  }
  if (!res.ok) throw new Error(`PageSpeed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as PsiResponse;

  const categories = json.lighthouseResult?.categories ?? {};
  const audits = json.lighthouseResult?.audits ?? {};

  return {
    url,
    strategy,
    scores: Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [
        k,
        v.score === null ? null : Math.round(v.score * 100),
      ]),
    ),
    lab: Object.fromEntries(LAB_AUDITS.map((id) => [id, audits[id]?.displayValue])),
    field: json.loadingExperience?.metrics
      ? {
          overall: json.loadingExperience.overall_category,
          metrics: json.loadingExperience.metrics,
        }
      : null,
    opportunities: Object.values(audits)
      .filter(
        (a) =>
          a.details?.type === "opportunity" &&
          (a.score ?? 1) < 0.9 &&
          (a.details.overallSavingsMs ?? 0) > 0,
      )
      .map((a) => ({ title: a.title, savingsMs: Math.round(a.details!.overallSavingsMs!) }))
      .sort((a, b) => b.savingsMs - a.savingsMs)
      .slice(0, 8),
  };
}
