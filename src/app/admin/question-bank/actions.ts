"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { currentUserIsStaff } from "@/lib/staff";
import {
  MAX_SOURCE_TEXT_LENGTH,
  parseQuestionsWithAI,
  type DraftQuestion,
} from "@/lib/ai-questions";

export async function addQuestion(formData: FormData) {
  const supabase = await createClient();

  const module_id = formData.get("module_id") as string;
  if (!module_id) throw new Error("Pilih modul dulu.");
  const category = formData.get("category") as string;
  const question_text = formData.get("question_text") as string;
  const options = JSON.parse(formData.get("options") as string);
  const correct_option_index = parseInt(
    formData.get("correct_option_index") as string,
  );
  const points = parseInt((formData.get("points") as string) || "10");

  const { error } = await supabase.from("question_bank").insert({
    module_id,
    category,
    question_text,
    options,
    correct_option_index,
    points,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/question-bank");
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("question_bank").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/question-bank");
}

export async function updateQuestion(id: string, formData: FormData) {
  const supabase = await createClient();

  const category = formData.get("category") as string;
  const question_text = formData.get("question_text") as string;
  const options = JSON.parse(formData.get("options") as string);
  const correct_option_index = parseInt(
    formData.get("correct_option_index") as string,
  );
  const points = parseInt((formData.get("points") as string) || "10");

  const { error } = await supabase
    .from("question_bank")
    .update({
      category,
      question_text,
      options,
      correct_option_index,
      points,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/question-bank");
}

export async function generateQuestionsFromText(
  sourceText: string,
  defaultCategory: string,
): Promise<{ questions: DraftQuestion[] } | { error: string }> {
  // Panggilan AI berbayar: hanya admin/guru.
  if (!(await currentUserIsStaff())) {
    return { error: "Hanya admin atau guru yang bisa memakai fitur ini." };
  }

  const text = sourceText.trim();
  if (!text) return { error: "Teks soal masih kosong." };
  if (text.length > MAX_SOURCE_TEXT_LENGTH) {
    return {
      error: `Teks terlalu panjang (maks. ${MAX_SOURCE_TEXT_LENGTH.toLocaleString("id-ID")} karakter). Pecah jadi beberapa bagian.`,
    };
  }

  return parseQuestionsWithAI(text, defaultCategory);
}

export async function saveDraftQuestions(
  moduleId: string,
  drafts: DraftQuestion[],
): Promise<{ saved: number } | { error: string }> {
  if (!moduleId) return { error: "Pilih modul dulu." };

  const rows = [];
  for (const [i, d] of drafts.entries()) {
    const options = d.options.map((o) => o.trim());
    if (
      !d.question_text.trim() ||
      options.length !== 4 ||
      options.some((o) => !o) ||
      !Number.isInteger(d.correct_option_index) ||
      d.correct_option_index < 0 ||
      d.correct_option_index > 3
    ) {
      return { error: `Soal #${i + 1} belum lengkap.` };
    }
    rows.push({
      module_id: moduleId,
      category: d.category.trim() || "Umum",
      question_text: d.question_text.trim(),
      options,
      correct_option_index: d.correct_option_index,
      points: Number.isInteger(d.points) && d.points > 0 ? d.points : 10,
    });
  }
  if (rows.length === 0) return { error: "Tidak ada soal yang dipilih." };

  const supabase = await createClient();
  const { error } = await supabase.from("question_bank").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/question-bank");
  return { saved: rows.length };
}

export async function bulkAddQuestions(questions: any[]) {
  const supabase = await createClient();

  const { error } = await supabase.from("question_bank").insert(questions);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/question-bank");
}
