import { toWaLink, type RegistrationEmailData, type PaymentNotificationData } from "@/lib/email";
import { formatRupiah } from "@/lib/pricing";

// Telegram's HTML parse mode only requires these three to be escaped.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildRegistrationTelegramText(data: RegistrationEmailData) {
  const e = escapeHtml;
  const dateFormatted = new Date(data.createdAt || Date.now()).toLocaleString(
    "id-ID",
    { timeZone: "Asia/Makassar" },
  );

  const paymentLine = data.paymentAmount
    ? data.paymentLinkCreated
      ? `\n💳 <b>Pembayaran:</b> menunggu ${formatRupiah(data.paymentAmount)} (Mayar)`
      : `\n⚠️ <b>Pembayaran:</b> link Mayar gagal dibuat — kirim tagihan ${formatRupiah(data.paymentAmount)} manual`
    : "";

  return (
    `🚀 <b>Pendaftaran Siswa Baru</b>\n\n` +
    `👤 <b>Nama:</b> ${e(data.studentName)}\n` +
    `📚 <b>Kelas:</b> ${e(data.selectedClass)}\n` +
    `📱 <b>WhatsApp:</b> ${e(data.whatsappNumber)}\n` +
    `✉️ <b>Email:</b> ${e(data.email)}\n` +
    `🏠 <b>Alamat:</b> ${e(data.address)}\n` +
    `🕒 <b>Waktu:</b> ${dateFormatted} WITA` +
    paymentLine
  );
}

export function buildPaymentTelegramText(data: PaymentNotificationData) {
  const e = escapeHtml;
  return (
    `💰 <b>Pembayaran Diterima</b>\n\n` +
    `👤 <b>Nama:</b> ${e(data.studentName)}\n` +
    `📚 <b>Kelas:</b> ${e(data.selectedClass)}\n` +
    `💳 <b>Nominal:</b> ${formatRupiah(data.amount)} (bulan pertama)\n` +
    `📱 <b>WhatsApp:</b> ${e(data.whatsappNumber)}`
  );
}

async function sendAdminTelegram(text: string, waLink: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      "⚠️ [TELEGRAM NOTIFICATION] Not sent: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.",
    );
    return { success: false, reason: "unconfigured" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [[{ text: "💬 Chat WhatsApp", url: waLink }]],
          },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Telegram API Error:", errorText);
      return { success: false, error: errorText };
    }

    console.log("✅ Admin notification sent via Telegram");
    return { success: true };
  } catch (err) {
    console.error("❌ Telegram dispatch error:", err);
    return { success: false, error: err };
  }
}

export function sendAdminRegistrationTelegram(data: RegistrationEmailData) {
  return sendAdminTelegram(buildRegistrationTelegramText(data), toWaLink(data));
}

export function sendAdminPaymentTelegram(data: PaymentNotificationData) {
  return sendAdminTelegram(buildPaymentTelegramText(data), toWaLink(data));
}
