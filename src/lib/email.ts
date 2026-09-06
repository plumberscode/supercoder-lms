import nodemailer from "nodemailer";

interface RegistrationEmailData {
  studentName: string;
  address: string;
  whatsappNumber: string;
  email: string;
  selectedClass: string;
  voucherCode?: string | null;
  voucherApplied?: boolean;
  createdAt?: string;
}

export async function sendAdminRegistrationNotification(
  data: RegistrationEmailData,
) {
  // Destination email: configured in .env.local or fallback
  const adminEmail = process.env.ADMIN_EMAIL || "henry.ferdiansyah@gmail.com";

  // Resend API Key option
  const resendApiKey = process.env.RESEND_API_KEY;

  // SMTP options (e.g. Gmail, Brevo, AWS SES, etc.)
  const smtpHost =
    process.env.SMTP_HOST ||
    (process.env.SMTP_USER?.includes("@gmail.com")
      ? "smtp.gmail.com"
      : undefined);
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom =
    process.env.SMTP_FROM ||
    `"Supercoder" <${smtpUser || "onboarding@resend.dev"}>`;

  const dateFormatted = data.createdAt
    ? new Date(data.createdAt).toLocaleString("id-ID", {
        timeZone: "Asia/Makassar",
      })
    : new Date().toLocaleString("id-ID", { timeZone: "Asia/Makassar" });

  // Clean WhatsApp phone number for link
  let cleanPhone = data.whatsappNumber.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.substring(1);
  }

  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Halo ${data.studentName}, terima kasih telah mendaftar di Supercoder untuk program ${data.selectedClass}. Kami ingin mengonfirmasi detail pendaftaran Anda.`,
  )}`;

  const emailSubject = data.voucherApplied
    ? `🎉 [Supercoder] Pendaftaran + VOUCHER PROMO 9.9: ${data.studentName} (${data.selectedClass})`
    : `🚀 [Supercoder] Pendaftaran Siswa Baru: ${data.studentName} (${data.selectedClass})`;

  const voucherRowHtml = data.voucherApplied
    ? `
            <tr>
              <td class="label">Kode Voucher</td>
              <td class="value" style="color: #db2777;">🎟️ ${data.voucherCode} (Promo 9.9 aktif — diskon Rp50.000/bulan selamanya)</td>
            </tr>`
    : data.voucherCode
      ? `
            <tr>
              <td class="label">Kode Voucher</td>
              <td class="value" style="color: #dc2626;">${data.voucherCode} (kode tidak valid)</td>
            </tr>`
      : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.92; }
        .content { padding: 28px; }
        .badge { display: inline-block; background-color: #fee2e2; color: #dc2626; font-weight: 700; font-size: 13px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 20px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .info-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-table td.label { font-weight: 600; color: #64748b; width: 38%; }
        .info-table td.value { font-weight: 700; color: #0f172a; }
        .action-button { display: block; text-align: center; background-color: #22c55e; color: #ffffff !important; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-top: 20px; }
        .footer { padding: 18px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🚀 Pendaftaran Siswa Baru!</h1>
          <p>Ada calon siswa yang baru saja mengisi formulir pendaftaran.</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge">Program: ${data.selectedClass}</span>
            ${
              data.voucherApplied
                ? `<span class="badge" style="background-color: #fce7f3; color: #db2777; margin-left: 8px;">🎉 Voucher Promo 9.9</span>`
                : ""
            }
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Nama Calon Siswa</td>
              <td class="value">${data.studentName}</td>
            </tr>
            <tr>
              <td class="label">Kelas Pilihan</td>
              <td class="value" style="color: #ea580c;">${data.selectedClass}</td>
            </tr>
            <tr>
              <td class="label">Nomor WhatsApp</td>
              <td class="value"><a href="${waLink}" style="color: #16a34a; text-decoration: none;">${data.whatsappNumber} 💬</a></td>
            </tr>
            <tr>
              <td class="label">Email Siswa</td>
              <td class="value"><a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a></td>
            </tr>
            <tr>
              <td class="label">Alamat</td>
              <td class="value">${data.address}</td>
            </tr>
            <tr>
              <td class="label">Waktu Pendaftaran</td>
              <td class="value">${dateFormatted} WITA</td>
            </tr>${voucherRowHtml}
          </table>

          <a href="${waLink}" class="action-button" target="_blank">
            💬 Hubungi Calon Siswa via WhatsApp
          </a>
        </div>
        <div class="footer">
          Notifikasi Otomatis Supercoder LMS &bull; ${new Date().getFullYear()}
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. If Resend API Key is provided:
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: smtpFrom || "Supercoder <onboarding@resend.dev>",
          to: [adminEmail],
          subject: emailSubject,
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Resend API Error:", errorText);
        return { success: false, error: errorText };
      }

      const resData = await res.json();
      console.log("✅ Email sent via Resend API:", resData);
      return { success: true, resData };
    } catch (err) {
      console.error("❌ Resend dispatch error:", err);
      return { success: false, error: err };
    }
  }

  // 2. If SMTP is configured (e.g. Gmail / Brevo / Custom SMTP):
  if (smtpUser && smtpPass) {
    try {
      const isGmail = smtpUser.includes("@gmail.com");
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: "gmail",
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
          : {
              host: smtpHost || "smtp.gmail.com",
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            },
      );

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: adminEmail,
        subject: emailSubject,
        html: htmlContent,
        text: `Pendaftaran Siswa Baru Supercoder:\nNama: ${data.studentName}\nKelas: ${data.selectedClass}\nWhatsApp: ${data.whatsappNumber}\nEmail: ${data.email}\nAlamat: ${data.address}\nWaktu: ${dateFormatted}${
          data.voucherCode
            ? `\nVoucher: ${data.voucherCode}${data.voucherApplied ? " (Promo 9.9 aktif — diskon Rp50.000/bulan selamanya)" : " (tidak valid)"}`
            : ""
        }`,
      });

      console.log(
        "✅ Admin registration notification email sent via SMTP:",
        info.messageId,
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email via SMTP:", error);
      return { success: false, error };
    }
  }

  // 3. Fallback / Unconfigured notice in server logs:
  console.warn(
    "⚠️ [EMAIL NOTIFICATION] Email not sent because SMTP or RESEND credentials are not set in .env.local.\n" +
      "To enable real email delivery, add ADMIN_EMAIL and SMTP_USER + SMTP_PASS (Gmail App Password) or RESEND_API_KEY to your .env.local file.",
    {
      to: adminEmail,
      studentName: data.studentName,
      selectedClass: data.selectedClass,
      whatsappNumber: data.whatsappNumber,
      email: data.email,
    },
  );

  return { success: false, reason: "unconfigured" };
}
