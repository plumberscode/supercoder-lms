"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { prepareChallengeDescription } from "@/lib/challenge-description";
import { PROGRAMS, type Program } from "@/lib/student-access";
import {
  sanitizeSources,
  validateSources,
  type QuizSource,
} from "@/lib/quiz-sources";

function parseSources(raw: string | null): QuizSource[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    throw new Error("Sumber soal tidak valid.");
  }
  const sources = sanitizeSources(parsed);
  const error = validateSources(sources);
  if (error) throw new Error(error);
  return sources;
}

const totalCount = (sources: QuizSource[]) =>
  sources.reduce((sum, s) => sum + s.count, 0);

export async function createModule(subjectId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const orderIndex = parseInt((formData.get("orderIndex") as string) || "0");

  const { error } = await supabase.from("modules").insert({
    subject_id: subjectId,
    title,
    order_index: orderIndex,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function createLesson(
  moduleId: string,
  subjectId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as any;
  const rawContent = (formData.get("contentUrl") as string) ?? "";
  // Materi teks disimpan sebagai HTML dari editor; sanitasi sebelum masuk DB.
  const contentUrl =
    type === "text" ? prepareChallengeDescription(rawContent) : rawContent;
  const orderIndex = parseInt((formData.get("orderIndex") as string) || "0");

  // Divalidasi sebelum materi disimpan agar tidak ada materi kuis tanpa kuis.
  const isDynamic = type === "quiz" && formData.get("is_dynamic") === "true";
  const sources = isDynamic
    ? parseSources(formData.get("sources") as string)
    : null;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,
      title,
      description,
      type,
      content_url: contentUrl,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (type === "quiz") {
    const { error: quizError } = await supabase.from("quizzes").insert({
      lesson_id: lesson.id,
      title,
      is_dynamic: isDynamic,
      sources,
      target_category: null,
      question_count: sources ? totalCount(sources) : 10,
    });

    if (quizError) throw new Error(quizError.message);
  }

  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function deleteLesson(lessonId: string, subjectId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function reorderModules(subjectId: string, modules: any[]) {
  const supabase = await createClient();

  await Promise.all(
    modules.map((m, index) =>
      supabase
        .from("modules")
        .update({ order_index: index + 1 })
        .eq("id", m.id),
    ),
  );

  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function reorderLessons(subjectId: string, lessons: any[]) {
  const supabase = await createClient();

  await Promise.all(
    lessons.map((l, index) =>
      supabase
        .from("lessons")
        .update({ order_index: index + 1 })
        .eq("id", l.id),
    ),
  );

  revalidatePath(`/admin/subjects/${subjectId}`);
}
export async function moveLesson(
  subjectId: string,
  lessonId: string,
  toModuleId: string,
  sourceLessons: any[],
  destLessons: any[],
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lessons")
    .update({ module_id: toModuleId })
    .eq("id", lessonId);

  if (error) throw new Error(error.message);

  await Promise.all(
    [sourceLessons, destLessons].flatMap((lessons) =>
      lessons.map((l, index) =>
        supabase
          .from("lessons")
          .update({ order_index: index + 1 })
          .eq("id", l.id),
      ),
    ),
  );

  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function updateModule(
  moduleId: string,
  subjectId: string,
  title: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("modules")
    .update({ title })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/subjects/${subjectId}`);
}

// Program yang boleh membuka modul ini (lihat migration_program_access.sql).
export async function updateModulePrograms(
  subjectId: string,
  updates: { id: string; programs: Program[] }[],
) {
  const supabase = await createClient();

  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from("modules")
        .update({
          programs: PROGRAMS.map((p) => p.value).filter((p) =>
            u.programs.includes(p),
          ),
        })
        .eq("id", u.id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath(`/admin/subjects/${subjectId}`);
  revalidatePath(`/subjects/${subjectId}`);
  revalidatePath("/dashboard");
}
export async function updateLesson(
  lessonId: string,
  subjectId: string,
  title: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lessons")
    .update({ title })
    .eq("id", lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function deleteModule(moduleId: string, subjectId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("modules").delete().eq("id", moduleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/subjects/${subjectId}`);
}
