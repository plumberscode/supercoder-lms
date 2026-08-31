"use server";

import { createClient } from "@/utils/supabase/server";
import { sendAdminRegistrationNotification } from "@/lib/email";

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
  };
};

export async function submitRegistration(
  prevState: any,
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
    const supabase = await createClient();

    const { error: insertError } = await supabase.from("registrations").insert({
      student_name: studentName,
      address: address,
      whatsapp_number: whatsappNumber,
      email: email,
      selected_class: selectedClass,
      status: "pending",
    });

    if (insertError) {
      console.error("Supabase error inserting registration:", insertError);
      return { error: `Gagal menyimpan pendaftaran: ${insertError.message}` };
    }

    // Trigger Admin Email Notification asynchronously in the background
    try {
      await sendAdminRegistrationNotification({
        studentName,
        address,
        whatsappNumber,
        email,
        selectedClass,
        createdAt: new Date().toISOString(),
      });
    } catch (emailErr) {
      console.error("Failed to dispatch admin notification email:", emailErr);
    }

    return {
      success: true,
      data: {
        id: "",
        studentName,
        address,
        whatsappNumber,
        email,
        selectedClass,
      },
    };
  } catch (err: any) {
    console.error("Unexpected server error on registration:", err);
    return {
      error: "Terjadi kendala sistem. Silakan coba beberapa saat lagi.",
    };
  }
}
