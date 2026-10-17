"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { currentUserIsStaff } from "@/lib/staff";
import {
  sanitizeSources,
  validateSources,
  type QuizSource,
} from "@/lib/quiz-sources";

export async function addQuestion(
  quizId: string,
  lessonId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const questionText = formData.get("questionText") as string;
  const option1 = formData.get("option1") as string;
  const option2 = formData.get("option2") as string;
  const option3 = formData.get("option3") as string;
  const option4 = formData.get("option4") as string;
  const correctIndex = parseInt(formData.get("correctIndex") as string);
  const points = parseInt((formData.get("points") as string) || "10");

  const { error } = await supabase.from("quiz_questions").insert({
    quiz_id: quizId,
    question_text: questionText,
    options: [option1, option2, option3, option4],
    correct_option_index: correctIndex,
    points: points,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/quizzes/${lessonId}`);
}

export async function deleteQuestion(questionId: string, lessonId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/quizzes/${lessonId}`);
}

export async function updateQuizSettings(
  lessonId: string,
  isDynamic: boolean,
  rawSources: QuizSource[],
): Promise<{ ok: true } | { error: string }> {
  if (!(await currentUserIsStaff())) {
    return { error: "Hanya admin atau guru yang bisa mengubah kuis." };
  }

  const sources = isDynamic ? sanitizeSources(rawSources) : null;
  if (sources) {
    const error = validateSources(sources);
    if (error) return { error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({
      is_dynamic: isDynamic,
      // Mode statik menyimpan sumber terakhir agar tidak hilang saat dinyalakan lagi.
      ...(sources && {
        sources,
        target_category: null,
        question_count: sources.reduce((sum, s) => sum + s.count, 0),
      }),
    })
    .eq("lesson_id", lessonId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/quizzes/${lessonId}`);
  revalidatePath(`/lessons/${lessonId}`);
  return { ok: true };
}
