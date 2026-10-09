"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isEmptyDescription, prepareChallengeDescription } from "@/lib/challenge-description";

export async function saveChallenge(
  lessonId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const rawDescription = (formData.get("description") as string) || "";
  if (isEmptyDescription(rawDescription)) return { error: "Deskripsi soal wajib diisi" };
  const description = prepareChallengeDescription(rawDescription);
  const language = formData.get("language") as string;
  const starterCode = formData.get("starterCode") as string;
  const starterHtml = (formData.get("starterHtml") as string) || "";
  const solutionCode = formData.get("solutionCode") as string;
  const hintsRaw = formData.get("hints") as string;
  const maxScore = parseInt((formData.get("maxScore") as string) || "100", 10);

  let hints: string[] = [];
  try {
    hints = JSON.parse(hintsRaw || "[]");
  } catch {
    hints = hintsRaw ? hintsRaw.split("\n").filter(Boolean) : [];
  }

  // Check if challenge already exists
  const { data: existing } = await supabase
    .from("coding_challenges")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("coding_challenges")
      .update({
        title,
        description,
        language,
        starter_code: starterCode,
        starter_html: starterHtml,
        solution_code: solutionCode,
        hints,
        max_score: maxScore,
      })
      .eq("id", existing.id);
    if (error) return { error: "Gagal memperbarui soal: " + error.message };
  } else {
    const { error } = await supabase.from("coding_challenges").insert({
      lesson_id: lessonId,
      title,
      description,
      language,
      starter_code: starterCode,
      starter_html: starterHtml,
      solution_code: solutionCode,
      hints,
      max_score: maxScore,
      created_by: user.id,
    });
    if (error) return { error: "Gagal membuat soal: " + error.message };
  }

  revalidatePath(`/admin/coding-challenges/${lessonId}`);
  return {};
}

export async function addTestCase(challengeId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const input = formData.get("input") as string;
  const expectedOutput = formData.get("expectedOutput") as string;
  const isHidden = formData.get("isHidden") === "true";
  const orderIndex = parseInt((formData.get("orderIndex") as string) || "0");

  const { error } = await supabase.from("test_cases").insert({
    challenge_id: challengeId,
    title,
    input,
    expected_output: expectedOutput,
    is_hidden: isHidden,
    order_index: orderIndex,
  });

  if (error) throw new Error("Gagal menambah test case: " + error.message);
  revalidatePath(`/admin/coding-challenges/`);
}

export async function deleteTestCase(testCaseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("test_cases")
    .delete()
    .eq("id", testCaseId);
  if (error) throw new Error("Gagal menghapus test case: " + error.message);
  revalidatePath(`/admin/coding-challenges/`);
}
