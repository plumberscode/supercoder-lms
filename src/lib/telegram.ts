import { toWaLink, type RegistrationEmailData } from "@/lib/email";

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

  const title = data.voucherApplied
    ? "🎉 <b>Pendaftaran + VOUCHER PROMO 9.9</b>"
    : "🚀 <b>Pendaftaran Siswa Baru</b>";

  const voucherLine = data.voucherCode
    ? `\n🎟️ <b>Voucher:</b> ${e(data.voucherCode)} ${
        data.voucherApplied ? "(Promo 9.9 aktif)" : "(kode tidak valid)"
      }`
    : "";

  return (
    `${title}\n\n` +
    `👤 <b>Nama:</b> ${e(data.studentName)}\n` +
    `📚 <b>Kelas:</b> ${e(data.selectedClass)}\n` +
    `📱 <b>WhatsApp:</b> ${e(data.whatsappNumber)}\n` +
    `✉️ <b>Email:</b> ${e(data.email)}\n` +
    `🏠 <b>Alamat:</b> ${e(data.address)}\n` +
    `🕒 <b>Waktu:</b> ${dateFormatted} WITA` +
    voucherLine
  );
}

export async function sendAdminRegistrationTelegram(
  data: RegistrationEmailData,
) {
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
          text: buildRegistrationTelegramText(data),
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: "💬 Chat WhatsApp", url: toWaLink(data) }],
            ],
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

    console.log("✅ Admin registration notification sent via Telegram");
    return { success: true };
  } catch (err) {
    console.error("❌ Telegram dispatch error:", err);
    return { success: false, error: err };
  }
}
