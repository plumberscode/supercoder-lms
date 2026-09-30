import { createSign } from "node:crypto";
import type { GscRow } from "../opportunities";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cachedToken: { token: string; expiresAt: number } | null = null;

export function gscConfigured(): boolean {
  return !!(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY);
}

const b64url = (input: string) => Buffer.from(input).toString("base64url");

/** Access token service account via JWT bearer (RS256), tanpa dependency Google SDK. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const email = process.env.GSC_CLIENT_EMAIL!;
  const key = process.env.GSC_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const unsigned = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`GSC auth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export type GscDimension = "query" | "page" | "country" | "device" | "date";

export type GscQuery = {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions: GscDimension[];
  rowLimit?: number;
  filters?: {
    dimension: "query" | "page" | "country" | "device";
    operator: "contains" | "equals" | "notContains";
    expression: string;
  }[];
};

export async function gscSearchAnalytics(property: string, q: GscQuery): Promise<GscRow[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: q.startDate,
        endDate: q.endDate,
        dimensions: q.dimensions,
        rowLimit: Math.min(q.rowLimit ?? 250, 5000),
        dimensionFilterGroups: q.filters?.length ? [{ filters: q.filters }] : undefined,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!res.ok) throw new Error(`GSC ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { rows?: GscRow[] };
  return json.rows ?? [];
}

/** Rentang tanggal N hari terakhir (data GSC tertunda ±2 hari). */
export function lastDays(days: number): { startDate: string; endDate: string } {
  const end = new Date(Date.now() - 2 * 86_400_000);
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}
