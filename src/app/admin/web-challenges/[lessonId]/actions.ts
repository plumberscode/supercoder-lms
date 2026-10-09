"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isEmptyDescription, prepareChallengeDescription } from "@/lib/challenge-description";

export async function saveWebChallenge(
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
  const mode = (formData.get("mode") as string) || "html-css-js";
  const starterHtml = (formData.get("starterHtml") as string) || "";
  const starterCss = (formData.get("starterCss") as string) || "";
  const starterJs = (formData.get("starterJs") as string) || "";
  const referenceHtml = (formData.get("referenceHtml") as string) || "";
  const referenceCss = (formData.get("referenceCss") as string) || "";
  const referenceJs = (formData.get("referenceJs") as string) || "";
  const maxScore = parseInt((formData.get("maxScore") as string) || "100", 10);

  // Check if challenge already exists
  const { data: existing } = await supabase
    .from("web_challenges")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("web_challenges")
      .update({
        title,
        description,
        mode,
        starter_html: starterHtml,
        starter_css: starterCss,
        starter_js: starterJs,
        reference_html: referenceHtml,
        reference_css: referenceCss,
        reference_js: referenceJs,
        max_score: maxScore,
      })
      .eq("id", existing.id);
    if (error) return { error: "Gagal memperbarui soal: " + error.message };
  } else {
    const { error } = await supabase.from("web_challenges").insert({
      lesson_id: lessonId,
      title,
      description,
      mode,
      starter_html: starterHtml,
      starter_css: starterCss,
      starter_js: starterJs,
      reference_html: referenceHtml,
      reference_css: referenceCss,
      reference_js: referenceJs,
      max_score: maxScore,
      created_by: user.id,
    });
    if (error) return { error: "Gagal membuat soal: " + error.message };
  }

  revalidatePath(`/admin/web-challenges/${lessonId}`);
  return {};
}
