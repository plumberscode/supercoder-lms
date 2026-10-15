"use server";

import { getLessonAccess, LESSON_ACCESS_DENIED } from "@/lib/lesson-access";
import { revalidatePath } from "next/cache";
import { getAIHint } from "@/lib/ai-hints";

export async function submitCodeSolution(params: {
  challengeId: string;
  lessonId: string;
  code: string;
  score: number;
  html?: string;
}) {
  const access = await getLessonAccess(params.lessonId);
  if (!access) throw new Error(LESSON_ACCESS_DENIED);
  const { supabase, user } = access;

  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score")
    .eq("student_id", user.id)
    .eq("content_id", params.lessonId)
    .eq("type", "code")
    .maybeSingle();

  if (existing) {
    if (params.score > (existing.score || 0)) {
      const { error } = await supabase
        .from("submissions")
        .update({
          data: {
            code: params.code,
            ...(params.html !== undefined && { html: params.html }),
          },
          score: params.score,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error("Gagal memperbarui: " + error.message);
    }

    // Award XP if student passes for the first time on a retry
    if (params.score >= 70 && (existing.score || 0) < 70) {
      const { data: challenge } = await supabase
        .from("coding_challenges")
        .select("max_score")
        .eq("id", params.challengeId)
        .single();
      const xpReward = challenge?.max_score ?? 100;
      await supabase.rpc("increment_xp", {
        user_id: user.id,
        amount: xpReward,
      });
    }
  } else {
    const { error } = await supabase.from("submissions").insert({
      student_id: user.id,
      content_id: params.lessonId,
      type: "code",
      data: {
        code: params.code,
        ...(params.html !== undefined && { html: params.html }),
      },
      score: params.score,
      status: "graded",
      submitted_at: new Date().toISOString(),
      graded_at: new Date().toISOString(),
    });
    if (error) throw new Error("Gagal menyimpan: " + error.message);

    // Fetch the challenge to get its max_score (XP weight)
    const { data: challenge } = await supabase
      .from("coding_challenges")
      .select("max_score")
      .eq("id", params.challengeId)
      .single();

    const xpReward = challenge?.max_score ?? 100;

    // Award XP only if first submission passes
    if (params.score >= 70) {
      await supabase.rpc("increment_xp", {
        user_id: user.id,
        amount: xpReward,
      });
    }
  }

  revalidatePath(`/lessons/${params.lessonId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/admin/gradebook");
  return { success: true };
}

export async function getCodeHint(params: {
  lessonId: string;
  challengeDescription: string;
  language: string;
  studentCode: string;
  testResults: {
    title: string;
    passed: boolean;
    expected: string;
    actual: string;
  }[];
  attemptNumber: number;
}): Promise<string> {
  if (!(await getLessonAccess(params.lessonId))) return LESSON_ACCESS_DENIED;

  return getAIHint(params);
}
