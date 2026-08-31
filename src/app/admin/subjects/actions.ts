"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSubject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  // Get current count for order_index
  const { count } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true });

  const { error } = await supabase.from("subjects").insert({
    title,
    description,
    created_by: user.id,
    order_index: (count || 0) + 1,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/subjects");
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/subjects");
}

export async function reorderSubjects(subjects: any[]) {
  const supabase = await createClient();

  const updates = subjects.map((s, index) => ({
    id: s.id,
    title: s.title,
    order_index: index + 1,
  }));

  const { error } = await supabase.from("subjects").upsert(updates);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/subjects");
}

export async function updateSubject(
  id: string,
  title: string,
  description: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("subjects")
    .update({ title, description })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/subjects");
}
