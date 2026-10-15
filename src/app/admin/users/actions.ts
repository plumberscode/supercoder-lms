"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Approve = jadikan siswa Supercoder. Lewat RPC (lihat migration_program_access.sql).
export async function approveUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("approve_student", {
    p_student_id: userId,
  });

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

export type StudentActiveState = { ok: boolean; message: string } | null;

// Lewat RPC karena RLS profiles hanya mengizinkan update profil sendiri (lihat migration_student_active.sql).
export async function setStudentActive(
  userId: string,
  active: boolean,
): Promise<StudentActiveState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_student_active", {
    p_student_id: userId,
    p_active: active,
  });

  if (error) {
    console.error("set_student_active error:", error);
    const missingFn = error.code === "PGRST202" || /set_student_active/.test(error.message);
    return {
      ok: false,
      message: missingFn
        ? "Gagal: jalankan migration_student_active.sql di Supabase terlebih dahulu."
        : `Gagal: ${error.message}`,
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/gradebook");
  revalidatePath("/admin/lesson-scores");
  revalidatePath("/admin/reports");
  revalidatePath("/leaderboard");
  return { ok: true, message: active ? "Siswa diaktifkan kembali" : "Siswa dinonaktifkan" };
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
