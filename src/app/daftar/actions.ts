"use server";

import { createClient } from "@/utils/supabase/server";
import { sendAdminRegistrationNotification } from "@/lib/email";
import { sendAdminRegistrationTelegram } from "@/lib/telegram";
import { createPaymentRequest } from "@/lib/mayar";
import { getClassPrice } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

// Link pembayaran Mayar berlaku 3 hari.
const PAYMENT_LINK_TTL_MS = 3 * 24 * 60 * 60 * 1000;

export type RegistrationResult = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    studentName: string;
    address: string;
    whatsappNumber: string;
    email: string;
    selectedClass: string;
    // Ada untuk Weekend/Premium bila link Mayar berhasil dibuat; client langsung redirect ke sini.
    paymentUrl: string | null;
    // true bila kelas berbayar online tapi link gagal dibuat (admin kirim tagihan manual).
    paymentPending: boolean;
  };
};

export async function submitRegistration(
  prevState: unknown,
  formData: FormData,
): Promise<RegistrationResult> {
  const studentName = formData.get("student_name")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const whatsappNumber = formData.get("whatsapp_number")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const selectedClass = formData.get("selected_class")?.toString().trim();

  if (!studentName) {
    return { error: "Nama calon siswa wajib diisi." };
  }
  if (!address) {
    return { error: "Alamat tempat tinggal wajib diisi." };
  }
  if (!whatsappNumber) {
    return { error: "Nomor WhatsApp aktif wajib diisi." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Email valid wajib diisi." };
  }
  if (!selectedClass) {
    return { error: "Silakan pilih kelas yang diminati." };
  }

  const validClasses = [
    "Weekend Coding Class",
    "Premium Online Class",
    "Custom Project Class",
  ];

  if (!validClasses.includes(selectedClass)) {
    return { error: "Pilihan kelas tidak valid." };
  }

  try {
    const registrationId = crypto.randomUUID();
    const paymentAmount = getClassPrice(selectedClass);

    // Weekend/Premium: buat link bayar Mayar dulu. Jika gagal, pendaftaran tetap disimpan
    // dan admin mengirim tagihan manual.
    let payment: { id: string; link: string } | null = null;
    if (paymentAmount) {
      const res = await createPaymentRequest({
        name: studentName,
        email,
        mobile: whatsappNumber,
        amount: paymentAmount,
        description: `Supercoder – ${selectedClass} (bulan pertama)`,
        redirectUrl: `${SITE_URL}/daftar/status?id=${registrationId}`,
        expiredAt: new Date(Date.now() + PAYMENT_LINK_TTL_MS).toISOString(),
        extraData: { registrationId },
      });
      if (res.success) {
        payment = { id: res.data.id, link: res.data.link };
      } else {
        console.error("Mayar payment link creation failed:", res.error);
      }
    }

    const supabase = await createClient();

    const { error: insertError } = await supabase.from("registrations").insert({
      id: registrationId,
      student_name: studentName,
      address: address,
      whatsapp_number: whatsappNumber,
      email: email,
      selected_class: selectedClass,
      status: "pending",
      payment_status: paymentAmount ? "unpaid" : null,
      payment_amount: paymentAmount,
      mayar_payment_id: payment?.id ?? null,
      mayar_payment_link: payment?.link ?? null,
    });

    if (insertError) {
      console.error("Supabase error inserting registration:", insertError);
      return { error: `Gagal menyimpan pendaftaran: ${insertError.message}` };
    }

    // Notify admin via Telegram (primary) and email (backup). A failed
    // notification is logged but never fails the registration itself.
    const notification = {
      studentName,
      address,
      whatsappNumber,
      email,
      selectedClass,
      paymentAmount,
      paymentLinkCreated: Boolean(payment),
      createdAt: new Date().toISOString(),
    };
    const channels = ["Telegram", "email"];
    const results = await Promise.allSettled([
      sendAdminRegistrationTelegram(notification),
      sendAdminRegistrationNotification(notification),
    ]);
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`Admin ${channels[i]} notification threw:`, result.reason);
      } else if (!result.value.success) {
        console.error(`Admin ${channels[i]} notification failed:`, result.value);
      }
    });

    return {
      success: true,
      data: {
        id: registrationId,
        studentName,
        address,
        whatsappNumber,
        email,
        selectedClass,
        paymentUrl: payment?.link ?? null,
        paymentPending: Boolean(paymentAmount) && !payment,
      },
    };
  } catch (err) {
    console.error("Unexpected server error on registration:", err);
    return {
      error: "Terjadi kendala sistem. Silakan coba beberapa saat lagi.",
    };
  }
}
