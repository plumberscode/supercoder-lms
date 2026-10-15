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

  return { supabase, user };
}

export const LESSON_ACCESS_DENIED = "Materi ini tidak tersedia untuk akunmu";
