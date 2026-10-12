import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import { markRegistrationPaid } from "@/lib/payments";

// Webhook Mayar (Integrasi > Webhook), didaftarkan sebagai
// https://www.supercoder.id/api/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>
// Mayar tidak menandatangani webhook, jadi token di URL hanya penyaring awal; status lunas
// selalu dicek ulang ke API Mayar di markRegistrationPaid.

function isValidToken(received: string | null) {
  const expected = process.env.MAYAR_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Docs Mayar belum memastikan field mana yang berisi id payment request, jadi semua kandidat
// dicocokkan ke kolom mayar_payment_id.
function candidateIds(data: Record<string, unknown> | undefined) {
  if (!data) return [];
  const keys = ["paymentLinkId", "productId", "paymentRequestId", "id", "transactionId"];
  return [...new Set(keys.map((k) => data[k]).filter((v): v is string => typeof v === "string" && v.length > 0))];
}

export async function POST(request: Request) {
  if (!isValidToken(new URL(request.url).searchParams.get("token"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const event: unknown = payload?.event ?? payload?.["event.received"];
  if (event !== "payment.received") {
    return Response.json({ ok: true, ignored: event ?? null });
  }

  const ids = candidateIds(payload?.data);
  if (ids.length === 0) {
    console.warn("⚠️ [MAYAR WEBHOOK] payment.received without ids:", JSON.stringify(payload));
    return Response.json({ ok: true, matched: false });
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("registrations")
    .select("mayar_payment_id")
    .in("mayar_payment_id", ids)
    .limit(1);

  if (error) {
    console.error("❌ [MAYAR WEBHOOK] DB lookup failed:", error);
    return Response.json({ error: "db_error" }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    // Bisa pembayaran produk Mayar lain (bukan pendaftaran). Payload dicatat untuk penelusuran.
    console.warn("⚠️ [MAYAR WEBHOOK] No registration matched:", JSON.stringify(payload));
    return Response.json({ ok: true, matched: false });
  }

  const result = await markRegistrationPaid(rows[0].mayar_payment_id);
  if (result.status === "error") {
    return Response.json({ error: result.error }, { status: 500 });
  }
  return Response.json({ ok: true, result: result.status });
}
