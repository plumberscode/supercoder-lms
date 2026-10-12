// Klien Mayar API V2 (Single Payment Request). Dipakai hanya di server.
// Docs: https://docs.mayar.id/api-reference-v2/reqpayment/create
// Beberapa endpoint menjawab HTTP 200 dengan statusCode non-200 di body, jadi body-lah acuannya.

const DEFAULT_BASE_URL = "https://api.mayar.id/hl/v2";

type MayarResult<T> = { success: true; data: T } | { success: false; error: string };

export interface CreatePaymentInput {
  name: string;
  amount: number;
  email?: string;
  mobile?: string;
  description?: string;
  redirectUrl?: string;
  expiredAt?: string;
  extraData?: Record<string, unknown>;
}

export interface PaymentRequest {
  id: string;
  status: string; // "unpaid" | "paid" | "closed"
  amount?: number;
  link?: string;
}

async function mayarFetch<T>(path: string, init?: RequestInit): Promise<MayarResult<T>> {
  const apiKey = process.env.MAYAR_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ [MAYAR] MAYAR_API_KEY is not set.");
    return { success: false, error: "unconfigured" };
  }
  const baseUrl = (process.env.MAYAR_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const body = await res.json().catch(() => null);
    const statusCode = body?.statusCode ?? res.status;
    if (!res.ok || statusCode !== 200 || !body?.data) {
      const message = body?.messages ?? body?.message ?? `HTTP ${res.status}`;
      console.error(`❌ Mayar API error (${path}):`, statusCode, message);
      return { success: false, error: String(message) };
    }
    return { success: true, data: body.data as T };
  } catch (err) {
    console.error(`❌ Mayar request failed (${path}):`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function createPaymentRequest(input: CreatePaymentInput) {
  return mayarFetch<{ id: string; transactionId?: string; link: string }>("/payments/create", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPaymentRequest(id: string) {
  return mayarFetch<PaymentRequest>(`/payments/${encodeURIComponent(id)}`);
}
