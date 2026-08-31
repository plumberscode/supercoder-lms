"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type TestimonialFormState = {
  success?: boolean;
  error?: string | null;
};

export async function submitTestimonial(
  _prevState: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Anda harus login terlebih dahulu untuk mengirim testimoni.",
    };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .single();

  const what_learned = (formData.get("what_learned") as string)?.trim();
  const learning_process = (formData.get("learning_process") as string)?.trim();
  const motivation = (formData.get("motivation") as string)?.trim();
  const improvement_suggestions = (
    formData.get("improvement_suggestions") as string
  )?.trim();
  const overall_impression = (
    formData.get("overall_impression") as string
  )?.trim();
  const ratingRaw = formData.get("rating") as string;
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : 5;

  if (
    !what_learned ||
    !learning_process ||
    !motivation ||
    !improvement_suggestions ||
    !overall_impression
  ) {
    return {
      success: false,
      error: "Mohon isi semua pertanyaan testimoni sebelum mengirim.",
    };
  }

  const studentName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Siswa Supercoder";
  const studentEmail = profile?.email || user.email || "";

  const { error: insertError } = await supabase.from("testimonials").insert({
    student_id: user.id,
    student_name: studentName,
    student_email: studentEmail,
    what_learned,
    learning_process,
    motivation,
    improvement_suggestions,
    overall_impression,
    rating: Math.min(Math.max(rating, 1), 5),
  });

  if (insertError) {
    console.error("Error submitting testimonial:", insertError);
    return {
      success: false,
      error: `Gagal mengirim testimoni: ${insertError.message}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/testimonials");
  revalidatePath("/admin/testimonials");

  return {
    success: true,
    error: null,
  };
}
