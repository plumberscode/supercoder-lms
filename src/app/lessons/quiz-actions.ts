"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getLessonAccess, LESSON_ACCESS_DENIED } from "@/lib/lesson-access";
import { awardXp } from "@/lib/xp";
import {
  answersMatchSources,
  groupBySource,
  pickQuestions,
  resolveSources,
  type QuizSource,
} from "@/lib/quiz-sources";

// XP untuk lulus kuis, hanya sekali per kuis per siswa.
const QUIZ_XP = 50;
const UNIQUE_VIOLATION = "23505";

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
  { error: string } | { score: number; passed: boolean; xpAwarded: number };

// Tabel soal hanya bisa dibaca staf (migration_xp_integrity.sql), jadi soal & kunci
// jawaban diambil lewat service role setelah akses materi dicek.
async function loadQuiz(lessonId: string) {
  const { data } = await createAdminClient()
    .from("quizzes")
    .select(
      "id, title, pass_score, is_dynamic, sources, target_category, question_count, lessons(module_id)",
    )
    .eq("lesson_id", lessonId)
    .maybeSingle();
  return data;
}

type LoadedQuiz = NonNullable<Awaited<ReturnType<typeof loadQuiz>>>;

function quizSources(quiz: LoadedQuiz) {
  const lesson = Array.isArray(quiz.lessons) ? quiz.lessons[0] : quiz.lessons;
  return resolveSources(quiz, lesson?.module_id as string | undefined);
}

// Soal bank dari semua modul sumber, dikelompokkan per sumber.
async function loadPools(sources: QuizSource[], columns: string) {
  if (sources.length === 0) return [];
  const { data } = await createAdminClient()
    .from("question_bank")
    .select(`id, module_id, category, ${columns}`)
    .in("module_id", [...new Set(sources.map((s) => s.module_id))]);
  return groupBySource(
    sources,
    (data ?? []) as unknown as ({
      id: string;
      module_id: string;
      category: string | null;
    } & Record<string, unknown>)[],
  );
}

// Soal untuk siswa, TANPA correct_option_index.
export async function getQuizForStudent(
  lessonId: string,
): Promise<StudentQuiz> {
  if (!(await getLessonAccess(lessonId)))
    return { error: LESSON_ACCESS_DENIED };

  const quiz = await loadQuiz(lessonId);
  if (!quiz) return { error: "Kuis tidak ditemukan untuk materi ini." };

  let questions: StudentQuizQuestion[] = [];
  if (quiz.is_dynamic) {
    const sources = quizSources(quiz);
    const pools = await loadPools(sources, "question_text, options");
    questions = pickQuestions(sources, pools).map((q) => ({
      id: q.id,
      question_text: q.question_text as string,
      options: q.options as string[],
    }));
  } else {
    const { data } = await createAdminClient()
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
  let key: { id: string; correct_option_index: number }[];
  let complete: boolean;
  if (quiz.is_dynamic) {
    const sources = quizSources(quiz);
    const pools = await loadPools(sources, "correct_option_index");
    complete = answersMatchSources(sources, pools, ids);
    key = pools
      .flat()
      .filter((q) => ids.includes(q.id))
      .map((q) => ({
        id: q.id,
        correct_option_index: q.correct_option_index as number,
      }));
  } else {
    const { data } = await admin
      .from("quiz_questions")
      .select("id, correct_option_index")
      .eq("quiz_id", quiz.id);
    key = (data ?? []).filter((q) => ids.includes(q.id));
    complete = key.length === ids.length && ids.length === (data?.length ?? 0);
  }

  // Semua soal yang tampil harus dijawab, dan hanya soal milik kuis ini.
  if (!complete) {
    return {
      error: "Jawaban tidak lengkap. Muat ulang halaman lalu coba lagi.",
    };
  }

  const correct = key.filter(
    (q) => answers[q.id] === q.correct_option_index,
  ).length;
  const score = Math.round((correct / key.length) * 100);
  const passScore = quiz.pass_score ?? 70;
  const passed = score >= passScore;

  // XP hanya untuk kelulusan pertama. Cek ini menangani data lama; unique index
  // submissions_quiz_xp_once (migration_quiz_xp_once.sql) mencegah dua kiriman
  // bersamaan sama-sama mendapat XP.
  const { data: previousPass } = await admin
    .from("submissions")
    .select("id")
    .eq("student_id", user.id)
    .eq("content_id", quiz.id)
    .eq("type", "quiz")
    .gte("score", passScore)
    .limit(1);

  const row = {
    student_id: user.id,
    content_id: quiz.id,
    type: "quiz",
    score,
    status: "graded",
  };
  let xpAwarded = passed && !previousPass?.length ? QUIZ_XP : 0;
  let { error } = await admin.from("submissions").insert({
    ...row,
    data: xpAwarded ? { answers, xp_awarded: xpAwarded } : { answers },
  });
  if (error?.code === UNIQUE_VIOLATION && xpAwarded) {
    // Kiriman lain sudah lebih dulu mendapat XP kuis ini.
    xpAwarded = 0;
    ({ error } = await admin
      .from("submissions")
      .insert({ ...row, data: { answers } }));
  }
  if (error) {
    console.error("Insert quiz submission failed:", error);
    return { error: "Gagal menyimpan jawaban. Coba lagi." };
  }

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

  const { error } = await createAdminClient()
    .from("submissions")
    .insert({
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
