import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const SEO_USER_AGENT =
  "Mozilla/5.0 (compatible; SupercoderSEOBot/1.0; +https://supercoder.id)";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function inRange(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const PRIVATE_V4 = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "224.0.0.0/3",
];

/** IP loopback, privat, link-local, multicast, dll. — tidak boleh di-fetch crawler. */
export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return PRIVATE_V4.some((cidr) => inRange(ip, cidr));
  if (version === 6) {
    const lower = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped) return isPrivateIp(mapped[1]);
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    );
  }
  return true;
}

/** Normalisasi input seperti "supercoder.id" → URL https. */
export function toUrl(input: string): URL {
  const trimmed = input.trim();
  return new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

/** Lempar error bila URL bukan http(s) publik (mitigasi SSRF). */
export async function assertPublicUrl(input: string | URL): Promise<URL> {
  const url = typeof input === "string" ? toUrl(input) : input;
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Protokol tidak diizinkan: ${url.protocol}`);
  }
  if (url.username || url.password) throw new Error("URL dengan kredensial tidak diizinkan.");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error(`Host tidak diizinkan: ${host}`);
  }

  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error(`Host mengarah ke alamat privat: ${host}`);
  }
  return url;
}

export type SafeFetchResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirects: { from: string; to: string; status: number }[];
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
  ms: number;
};

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  accept?: string;
};

async function readLimited(res: Response, maxBytes: number) {
  if (!res.body) return { body: "", truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      chunks.push(value.subarray(0, value.byteLength - (size - maxBytes)));
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }
  return { body: Buffer.concat(chunks).toString("utf8"), truncated };
}

/**
 * fetch dengan pengaman: hanya host publik (dicek ulang tiap redirect), timeout,
 * dan batas ukuran body. Status HTTP ≥ 400 tidak dilempar — dikembalikan apa adanya.
 */
export async function safeFetch(
  input: string,
  opts: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const started = Date.now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const redirects: SafeFetchResult["redirects"] = [];

  let current = await assertPublicUrl(input);
  const requestedUrl = current.toString();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": SEO_USER_AGENT,
        Accept: opts.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
    });

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, current);
      redirects.push({ from: current.toString(), to: next.toString(), status: res.status });
      await res.body?.cancel().catch(() => {});
      current = await assertPublicUrl(next);
      continue;
    }

    const { body, truncated } = await readLimited(res, maxBytes);
    return {
      requestedUrl,
      finalUrl: current.toString(),
      status: res.status,
      redirects,
      headers: Object.fromEntries(res.headers.entries()),
      body,
      truncated,
      ms: Date.now() - started,
    };
  }
  throw new Error(`Terlalu banyak redirect (> ${MAX_REDIRECTS}) dari ${requestedUrl}`);
}

export type Fetcher = (url: string, opts?: SafeFetchOptions) => Promise<SafeFetchResult>;
