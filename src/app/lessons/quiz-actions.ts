"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getLessonAccess, LESSON_ACCESS_DENIED } from "@/lib/lesson-access";
import { awardXp } from "@/lib/xp";

// XP untuk lulus kuis, hanya sekali per kuis per siswa.
const QUIZ_XP = 50;

export type StudentQuizQuestion = {
  id: string;
  question_text: string;
  options: string[];
};

export type StudentQuiz =
  | { error: string }
  | {
      quiz: { id: string; title: string; passScore: number };
      questions: StudentQuizQuestion[];
    };

export type QuizResult =
  | { error: string }
  | { score: number; passed: boolean; xpAwarded: number };

// Tabel soal hanya bisa dibaca staf (migration_xp_integrity.sql), jadi soal & kunci
// jawaban diambil lewat service role setelah akses materi dicek.
async function loadQuiz(lessonId: string) {
  const { data } = await createAdminClient()
    .from("quizzes")
    .select("id, title, pass_score, is_dynamic, target_category, question_count")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  return data;
}

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Soal untuk siswa, TANPA correct_option_index.
export async function getQuizForStudent(lessonId: string): Promise<StudentQuiz> {
  if (!(await getLessonAccess(lessonId))) return { error: LESSON_ACCESS_DENIED };

  const quiz = await loadQuiz(lessonId);
  if (!quiz) return { error: "Kuis tidak ditemukan untuk materi ini." };

  const admin = createAdminClient();
  let questions: StudentQuizQuestion[] = [];
  if (quiz.is_dynamic) {
    const { data } = await admin
      .from("question_bank")
      .select("id, question_text, options")
      .eq("category", quiz.target_category);
    questions = shuffle(data ?? []).slice(0, quiz.question_count || 10);
  } else {
    const { data } = await admin
      .from("quiz_questions")
      .select("id, question_text, options")
      .eq("quiz_id", quiz.id);
    questions = data ?? [];
  }

  return {
    quiz: { id: quiz.id, title: quiz.title, passScore: quiz.pass_score ?? 70 },
    questions,
  };
}

// Dinilai di server: kunci jawaban tidak pernah dikirim ke browser.
export async function submitQuiz(
  lessonId: string,
  answers: Record<string, number>,
): Promise<QuizResult> {
  const access = await getLessonAccess(lessonId);
  if (!access) return { error: LESSON_ACCESS_DENIED };
  const { user } = access;

  const quiz = await loadQuiz(lessonId);
  if (!quiz) return { error: "Kuis tidak ditemukan untuk materi ini." };

  const ids = Object.keys(answers ?? {});
  if (ids.length === 0 || ids.some((id) => !Number.isInteger(answers[id]))) {
    return { error: "Jawaban tidak valid." };
  }

  const admin = createAdminClient();
  let expected: number;
  let key: { id: string; correct_option_index: number }[];
  if (quiz.is_dynamic) {
    const [{ data }, { count }] = await Promise.all([
      admin
        .from("question_bank")
        .select("id, correct_option_index")
        .eq("category", quiz.target_category)
        .in("id", ids),
      admin
        .from("question_bank")
        .select("id", { count: "exact", head: true })
        .eq("category", quiz.target_category),
    ]);
    key = data ?? [];
    expected = Math.min(quiz.question_count || 10, count ?? 0);
  } else {
    const { data } = await admin
      .from("quiz_questions")
      .select("id, correct_option_index")
      .eq("quiz_id", quiz.id);
    key = (data ?? []).filter((q) => ids.includes(q.id));
    expected = data?.length ?? 0;
  }

  // Semua soal yang tampil harus dijawab, dan hanya soal milik kuis ini.
  if (key.length !== ids.length || ids.length !== expected) {
    return { error: "Jawaban tidak lengkap. Muat ulang halaman lalu coba lagi." };
  }

  const correct = key.filter((q) => answers[q.id] === q.correct_option_index).length;
  const score = Math.round((correct / key.length) * 100);
  const passScore = quiz.pass_score ?? 70;
  const passed = score >= passScore;

  // Bug lama: XP diberikan setiap kali lulus. Sekarang hanya kelulusan pertama.
  const { data: previousPass } = await admin
    .from("submissions")
    .select("id")
    .eq("student_id", user.id)
    .eq("content_id", quiz.id)
    .eq("type", "quiz")
    .gte("score", passScore)
    .limit(1);

  const { error } = await admin.from("submissions").insert({
    student_id: user.id,
    content_id: quiz.id,
    type: "quiz",
    data: answers,
    score,
    status: "graded",
  });
  if (error) {
    console.error("Insert quiz submission failed:", error);
    return { error: "Gagal menyimpan jawaban. Coba lagi." };
  }

  const xpAwarded = passed && !previousPass?.length ? QUIZ_XP : 0;
  if (xpAwarded) await awardXp(user.id, xpAwarded);

  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/admin/gradebook");
  return { score, passed, xpAwarded };
}

// Proyek: link dikirim lewat server agar siswa tidak bisa menulis tabel submissions langsung.
export async function submitProject(
  lessonId: string,
  link: string,
): Promise<{ error: string } | { ok: true }> {
  const access = await getLessonAccess(lessonId);
  if (!access) return { error: LESSON_ACCESS_DENIED };

  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return { error: "Link tidak valid." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "Link harus diawali http:// atau https://" };
  }

  const { error } = await createAdminClient().from("submissions").insert({
    student_id: access.user.id,
    content_id: lessonId,
    type: "project",
    data: { link: url.toString() },
    status: "submitted",
  });
  if (error) {
    console.error("Insert project submission failed:", error);
    return { error: "Gagal mengirim proyek. Coba lagi." };
  }

  revalidatePath("/admin/submissions");
  return { ok: true };
}
