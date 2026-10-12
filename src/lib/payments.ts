import { createAdminClient } from "@/utils/supabase/admin";
import { getPaymentRequest } from "@/lib/mayar";
import { sendAdminPaymentNotification } from "@/lib/email";
import { sendAdminPaymentTelegram } from "@/lib/telegram";

export type MarkPaidResult =
  | { status: "marked" | "already_paid" | "not_paid" | "not_found" }
  | { status: "error"; error: string };

/**
 * Tandai pendaftaran lunas berdasarkan id payment request Mayar. Dipakai webhook dan halaman
 * status. Status SELALU dicek ulang ke API Mayar (webhook Mayar tidak bertanda tangan), dan
 * update bersyarat `payment_status <> 'paid'` membuat notifikasi admin hanya terkirim sekali.
 */
export async function markRegistrationPaid(paymentId: string): Promise<MarkPaidResult> {
  const payment = await getPaymentRequest(paymentId);
  if (!payment.success) {
    return { status: "error", error: payment.error };
  }
  if (payment.data.status !== "paid") {
    return { status: "not_paid" };
  }

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("registrations")
    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("mayar_payment_id", paymentId)
    .neq("payment_status", "paid")
    .select("student_name, whatsapp_number, email, selected_class, payment_amount");

  if (error) {
    console.error("❌ Failed to mark registration paid:", error);
    return { status: "error", error: error.message };
  }

  if (!updated || updated.length === 0) {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("mayar_payment_id", paymentId);
    return { status: count ? "already_paid" : "not_found" };
  }

  const row = updated[0];
  const notification = {
    studentName: row.student_name,
    whatsappNumber: row.whatsapp_number,
    email: row.email,
    selectedClass: row.selected_class,
    amount: row.payment_amount ?? payment.data.amount ?? 0,
  };
  const results = await Promise.allSettled([
    sendAdminPaymentTelegram(notification),
    sendAdminPaymentNotification(notification),
  ]);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Admin payment notification threw:", result.reason);
    }
  });

  return { status: "marked" };
}
