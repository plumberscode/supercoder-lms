"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteTestimonial(testimonialId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "teacher") {
    throw new Error("Hanya admin atau guru yang dapat menghapus testimoni.");
  }

  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", testimonialId);

  if (error) {
    console.error("Error deleting testimonial:", error);
    throw new Error(`Gagal menghapus testimoni: ${error.message}`);
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/dashboard/testimonials");
  return { success: true };
}
