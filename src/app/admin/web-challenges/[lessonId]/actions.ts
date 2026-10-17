"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isEmptyDescription, prepareChallengeDescription } from "@/lib/challenge-description";
import { isWebMode, webModeParts } from "@/lib/web-mode";

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
  if (!isWebMode(mode)) return { error: "Mode soal tidak valid" };
  // Bagian yang tidak dipakai mode ini disimpan kosong.
  const parts = webModeParts(mode);
  const field = (name: string, used: boolean) =>
    used ? (formData.get(name) as string) || "" : "";
  const starterHtml = field("starterHtml", parts.html);
  const starterCss = field("starterCss", parts.css);
  const starterJs = field("starterJs", parts.js);
  const referenceHtml = field("referenceHtml", parts.html);
  const referenceCss = field("referenceCss", parts.css);
  const referenceJs = field("referenceJs", parts.js);
  if (parts.html && !referenceHtml.trim()) {
    return { error: "Reference HTML wajib diisi" };
  }
  if (mode === "js" && !referenceJs.trim()) {
    return { error: "Reference JS wajib diisi untuk mode JavaScript saja" };
  }
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
