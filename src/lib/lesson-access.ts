import { createClient } from "@/utils/supabase/server";
import { canAccessModule } from "@/lib/student-access";

// Untuk server action materi: pengguna harus login dan materi harus ada di modul
// program-nya. Mengembalikan null jika tidak, agar grading/hint AI tidak dipanggil.
// Pengumpulan jawaban juga dijaga trigger guard_submission_access di database.
export async function getLessonAccess(lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: viewer }, { data: lesson }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("id, module_id(*)").eq("id", lessonId).single(),
  ]);
  if (!viewer || !lesson) return null;
  if (!canAccessModule(viewer, (lesson.module_id as any)?.programs)) return null;

  return { supabase, user, viewer };
}

export const LESSON_ACCESS_DENIED = "Materi ini tidak tersedia untuk akunmu";

// Samakan dengan batas di fungsi SQL consume_ai_hint (migration_teaser.sql).
export const TEASER_DAILY_HINTS = 5;

// Untuk AI Hint: null jika boleh, atau pesan untuk siswa jika tidak. Teaser dibatasi
// per hari; pemakaiannya dicatat oleh consume_ai_hint.
export async function checkHintAllowed(lessonId: string): Promise<string | null> {
  const access = await getLessonAccess(lessonId);
  if (!access) return LESSON_ACCESS_DENIED;

  const { data: allowed, error } = await access.supabase.rpc("consume_ai_hint");
  if (error) {
    console.error("consume_ai_hint error:", error);
    // Gagal tertutup hanya untuk teaser (akses publik); siswa lain tetap dapat hint.
    return access.viewer.program === "teaser" ? "Petunjuk sedang tidak tersedia." : null;
  }
  if (!allowed) {
    return `Jatah petunjuk hari ini habis (${TEASER_DAILY_HINTS}/hari). Siswa kelas Supercoder bisa minta petunjuk tanpa batas.`;
  }
  return null;
}
