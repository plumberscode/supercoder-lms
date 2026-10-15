"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { isStaff } from "@/lib/student-access";
import {
  generatePassword,
  minasEmail,
  parseNameList,
  pickUsername,
  usernameBase,
} from "@/lib/minas";

export type MinasCredential = {
  fullName: string;
  username: string;
  password: string;
};

export type CreateMinasState = {
  created: MinasCredential[];
  failed: { fullName: string; message: string }[];
  error?: string;
} | null;

const MAX_PER_IMPORT = 60;

// Action ini memakai service role (melewati RLS), jadi pemanggilnya wajib admin/guru.
async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return isStaff(profile?.role);
}

export async function createMinasStudents(
  _prev: CreateMinasState,
  formData: FormData,
): Promise<CreateMinasState> {
  if (!(await requireStaff())) {
    return { created: [], failed: [], error: "Hanya admin atau guru." };
  }

  const names = parseNameList((formData.get("names") as string) || "");
  if (names.length === 0) {
    return { created: [], failed: [], error: "Tulis minimal satu nama." };
  }
  if (names.length > MAX_PER_IMPORT) {
    return {
      created: [],
      failed: [],
      error: `Maksimal ${MAX_PER_IMPORT} nama sekali import. Bagi menjadi beberapa kali.`,
    };
  }

  const admin = createAdminClient();
  const { data: existing, error: listError } = await admin
    .from("profiles")
    .select("username")
    .not("username", "is", null);
  if (listError) {
    return { created: [], failed: [], error: `Gagal: ${listError.message}` };
  }
  const taken = new Set((existing ?? []).map((p) => p.username.toLowerCase()));

  const created: MinasCredential[] = [];
  const failed: { fullName: string; message: string }[] = [];

  // Berurutan agar username yang baru dipakai langsung masuk ke daftar "taken".
  for (const fullName of names) {
    const username = pickUsername(usernameBase(fullName), taken);
    taken.add(username);
    const password = generatePassword();

    const { data, error } = await admin.auth.admin.createUser({
      email: minasEmail(username),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      // Dibaca trigger handle_new_user (migration_program_access.sql).
      app_metadata: { program: "minas", username },
    });
    if (error || !data.user) {
      failed.push({ fullName, message: error?.message ?? "Gagal membuat akun" });
      continue;
    }

    // Akun buatan guru langsung aktif. Program & username juga diisi di sini, tidak hanya
    // mengandalkan trigger: app_metadata belum tentu sudah ada saat baris auth.users dibuat.
    const { error: approveError } = await admin
      .from("profiles")
      .update({
        status: "approved",
        program: "minas",
        username,
        full_name: fullName,
      })
      .eq("id", data.user.id);
    if (approveError) {
      failed.push({
        fullName,
        message: `Akun ${username} dibuat tapi belum aktif: ${approveError.message}`,
      });
      continue;
    }

    created.push({ fullName, username, password });
  }

  revalidatePath("/admin/minas");
  revalidatePath("/admin/users");
  return { created, failed };
}

export type ResetPasswordResult =
  | { ok: true; credential: MinasCredential }
  | { ok: false; message: string };

export async function resetMinasPassword(
  userId: string,
): Promise<ResetPasswordResult> {
  if (!(await requireStaff())) {
    return { ok: false, message: "Hanya admin atau guru." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, username, program")
    .eq("id", userId)
    .single();
  if (!profile || profile.program !== "minas" || !profile.username) {
    return { ok: false, message: "Bukan akun siswa MINAS." };
  }

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, message: `Gagal: ${error.message}` };

  return {
    ok: true,
    credential: {
      fullName: profile.full_name ?? profile.username,
      username: profile.username,
      password,
    },
  };
}
