"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, formData: FormData) {
  const supabase = await createClient();
  const role = formData.get("role") as string;

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export type ParentContactState = { ok: boolean; message: string } | null;

// Lewat RPC karena RLS profiles hanya mengizinkan update profil sendiri (lihat migration_parent_contact.sql).
export async function updateParentContact(
  userId: string,
  _prev: ParentContactState,
  formData: FormData,
): Promise<ParentContactState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_parent_contact", {
    p_student_id: userId,
    p_parent_name: (formData.get("parent_name") as string) || "",
    p_parent_whatsapp: (formData.get("parent_whatsapp") as string) || "",
  });

  if (error) {
    console.error("set_parent_contact error:", error);
    const missingFn = error.code === "PGRST202" || /set_parent_contact/.test(error.message);
    return {
      ok: false,
      message: missingFn
        ? "Gagal: jalankan migration_parent_contact.sql di Supabase terlebih dahulu."
        : `Gagal: ${error.message}`,
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
  return { ok: true, message: "Tersimpan ✓" };
}
