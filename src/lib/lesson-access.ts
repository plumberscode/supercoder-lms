import { createClient } from "@/utils/supabase/server";
import {
  canAccessModule,
  followsLessonSequence,
  lockedBySequence,
  type Viewer,
} from "@/lib/student-access";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Nilai terbaik siswa per materi (null = sudah dikirim, belum dinilai). Submission kuis
// memakai id kuis, jadi dipetakan kembali ke id materinya.
export async function loadBestScores(
  supabase: SupabaseClient,
  studentId: string,
  lessonIds: string[],
) {
  const bestScore = new Map<string, number | null>();
  if (lessonIds.length === 0) return bestScore;

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, lesson_id")
    .in("lesson_id", lessonIds);
  const quizLesson = new Map((quizzes ?? []).map((q) => [q.id, q.lesson_id]));

  const { data: submissions } = await supabase
    .from("submissions")
    .select("content_id, score")
    .eq("student_id", studentId)
    .in("content_id", [...lessonIds, ...quizLesson.keys()]);

  submissions?.forEach((sub) => {
    const lessonId = quizLesson.get(sub.content_id) ?? sub.content_id;
    const prev = bestScore.get(lessonId) ?? null;
    bestScore.set(lessonId, sub.score === null ? prev : Math.max(prev ?? 0, sub.score));
  });
  return bestScore;
}

// Teaser: materi terkunci sampai materi bernilai sebelumnya di mata pelajaran yang sama lulus.
export async function isLockedBySequence(
  supabase: SupabaseClient,
  viewer: Viewer,
  studentId: string,
  subjectId: string,
  lessonId: string,
) {
  if (!followsLessonSequence(viewer)) return false;

  const { data: modules } = await supabase
    .from("modules")
    .select("order_index, programs, lessons(id, type, is_project_required, order_index)")
    .eq("subject_id", subjectId);
  const lessons = (modules ?? [])
    .filter((m: any) => canAccessModule(viewer, m.programs))
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .flatMap((m: any) =>
      [...(m.lessons ?? [])].sort((a: any, b: any) => a.order_index - b.order_index),
    );

  const bestScore = await loadBestScores(
    supabase,
    studentId,
    lessons.map((l: any) => l.id as string),
  );
  return lockedBySequence(lessons, bestScore).has(lessonId);
}

// Untuk server action materi: pengguna harus login, materi harus ada di modul
// program-nya, dan (untuk teaser) materi sebelumnya sudah lulus. Mengembalikan null
// jika tidak, agar grading/hint AI tidak dipanggil. Pengumpulan jawaban juga dijaga trigger guard_submission_access di database.
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
  const lessonModule = lesson.module_id as any;
  if (!canAccessModule(viewer, lessonModule?.programs)) return null;
  if (
    await isLockedBySequence(supabase, viewer, user.id, lessonModule.subject_id, lesson.id)
  ) {
    return null;
  }

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
