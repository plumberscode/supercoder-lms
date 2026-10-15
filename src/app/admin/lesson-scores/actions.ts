"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PASS_SCORE } from "@/lib/reports";
import { currentUserIsStaff } from "@/lib/staff";
import { awardXp } from "@/lib/xp";

export async function saveLessonXpReward(formData: FormData) {
  const supabase = await createClient();

  const lessonId = formData.get("lessonId") as string;
  const xpReward = parseInt(formData.get("xpReward") as string);

  if (!lessonId || isNaN(xpReward) || xpReward < 0) {
    throw new Error("Bobot XP tidak valid");
  }

  const { error } = await supabase
    .from("lessons")
    .update({ xp_reward: xpReward })
    .eq("id", lessonId);

  if (error) {
    console.error("Error updating xp_reward:", error);
    throw new Error(
      `Gagal menyimpan bobot XP: ${error.message}. Pastikan migration_lesson_xp_reward.sql sudah dijalankan.`,
    );
  }

  revalidatePath("/admin/lesson-scores");
}

export async function submitLessonScore(formData: FormData) {
  // XP diberikan lewat service role, jadi pemanggilnya wajib admin/guru.
  if (!(await currentUserIsStaff())) throw new Error("Hanya admin atau guru.");
  const supabase = await createClient();

  const lessonId = formData.get("lessonId") as string;
  const studentId = formData.get("studentId") as string;
  const score = parseInt(formData.get("score") as string);
  const feedback = formData.get("feedback") as string;

  if (!lessonId || !studentId || isNaN(score)) {
    throw new Error("Data tidak lengkap");
  }

  // Cek apakah sudah ada nilai sebelumnya untuk lesson ini oleh student ini
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score, data")
    .eq("student_id", studentId)
    .eq("content_id", lessonId)
    .eq("type", "lesson")
    .maybeSingle();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("xp_reward")
    .eq("id", lessonId)
    .maybeSingle();
  const xpReward: number = lesson?.xp_reward ?? 0;

  // XP diberikan sekali per siswa per materi. Penanda di data mencegah XP ganda
  // saat nilai diturunkan lalu dinaikkan lagi.
  const alreadyAwarded = !!existing?.data?.xp_awarded;
  const shouldAwardXp = score >= PASS_SCORE && xpReward > 0 && !alreadyAwarded;
  const data = {
    ...(existing?.data || {}),
    ...(shouldAwardXp && { xp_awarded: xpReward }),
  };

  if (existing) {
    // Update
    const { error } = await supabase
      .from("submissions")
      .update({
        score,
        feedback,
        data,
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating score:", error);
      throw new Error("Gagal memperbarui nilai");
    }
  } else {
    // Insert
    const { error } = await supabase.from("submissions").insert({
      student_id: studentId,
      content_id: lessonId,
      type: "lesson",
      data,
      score,
      feedback,
      status: "graded",
      graded_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error inserting score:", error);
      throw new Error(
        `Gagal menyimpan nilai baru: ${error.message} (${error.details || ""})`,
      );
    }
  }

  if (shouldAwardXp) {
    await awardXp(studentId, xpReward);
  }

  revalidatePath("/admin/lesson-scores");
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}
