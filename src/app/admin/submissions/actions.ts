"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { currentUserIsStaff } from "@/lib/staff";
import { awardXp } from "@/lib/xp";

export async function gradeSubmission(
  submissionId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await currentUserIsStaff())) throw new Error("Unauthorized");

  const score = parseInt(formData.get("score") as string);
  const feedback = formData.get("feedback") as string;
  if (isNaN(score) || score < 0 || score > 100) throw new Error("Nilai harus 0-100");

  // Siswa & nilai lama diambil dari database, bukan dari form, agar XP tepat sasaran.
  const { data: existing, error: fetchError } = await supabase
    .from("submissions")
    .select("student_id, score")
    .eq("id", submissionId)
    .single();
  if (fetchError || !existing) throw new Error("Kiriman tidak ditemukan");

  const { error } = await supabase
    .from("submissions")
    .update({
      score,
      feedback,
      status: "graded",
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw new Error(error.message);

  // XP proyek hanya sekali: saat pertama kali dinilai lulus (bukan setiap dinilai ulang).
  if (score >= 70 && (existing.score ?? 0) < 70) {
    await awardXp(existing.student_id, 100);
  }

  revalidatePath("/admin/submissions");
}
