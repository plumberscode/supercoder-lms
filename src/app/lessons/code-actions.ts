"use server";

import {
  checkHintAllowed,
  getLessonAccess,
  LESSON_ACCESS_DENIED,
} from "@/lib/lesson-access";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { awardXp } from "@/lib/xp";
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

  // Tes dijalankan di browser, jadi skor masih berasal dari browser; minimal dibatasi
  // 0-100. Penilaian yang tidak bisa dipalsukan butuh runner kode di server.
  const score = Math.max(0, Math.min(100, Math.round(Number(params.score) || 0)));
  const admin = createAdminClient();

  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score")
    .eq("student_id", user.id)
    .eq("content_id", params.lessonId)
    .eq("type", "code")
    .maybeSingle();

  if (existing) {
    if (score > (existing.score || 0)) {
      const { error } = await admin
        .from("submissions")
        .update({
          data: {
            code: params.code,
            ...(params.html !== undefined && { html: params.html }),
          },
          score: score,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error("Gagal memperbarui: " + error.message);
    }

    // Award XP if student passes for the first time on a retry
    if (score >= 70 && (existing.score || 0) < 70) {
      const { data: challenge } = await supabase
        .from("coding_challenges")
        .select("max_score")
        .eq("id", params.challengeId)
        .single();
      const xpReward = challenge?.max_score ?? 100;
      await awardXp(user.id, xpReward);
    }
  } else {
    const { error } = await admin.from("submissions").insert({
      student_id: user.id,
      content_id: params.lessonId,
      type: "code",
      data: {
        code: params.code,
        ...(params.html !== undefined && { html: params.html }),
      },
      score: score,
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
    if (score >= 70) {
      await awardXp(user.id, xpReward);
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
  const hintBlocked = await checkHintAllowed(params.lessonId);
  if (hintBlocked) return hintBlocked;

  return getAIHint(params);
}
