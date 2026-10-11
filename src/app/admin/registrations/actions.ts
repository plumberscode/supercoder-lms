"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRegistrationStatus(id: string, status: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(`Gagal mengubah status: ${error.message}`);
  }
  // RLS yang menolak update tidak menghasilkan error, hanya 0 baris.
  if (!data || data.length === 0) {
    throw new Error("Gagal mengubah status: tidak ada baris yang diperbarui");
  }

  revalidatePath("/admin/registrations");
}

export async function deleteRegistration(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("registrations").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus pendaftaran: ${error.message}`);
  }

  revalidatePath("/admin/registrations");
}
