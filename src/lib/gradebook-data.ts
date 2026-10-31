import type { SupabaseClient } from "@supabase/supabase-js";
import { SCORED_TYPES, type GbSubmission } from "@/lib/gradebook";

const PAGE_SIZE = 1000;

// Supabase memotong hasil query di 1.000 baris; ambil halaman demi halaman sampai habis.
// Query harus diurutkan stabil (mis. berdasarkan id) agar halaman tidak tumpang tindih.
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function fetchCatalog(supabase: SupabaseClient) {
  const [subjects, modules, lessons, quizzes] = await Promise.all([
    supabase.from("subjects").select("id, title").order("order_index"),
    supabase.from("modules").select("id, subject_id, title, order_index, programs").order("order_index"),
    fetchAllRows((from, to) =>
      supabase
        .from("lessons")
        .select("id, module_id, title, type, order_index, xp_reward")
        .order("id")
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase.from("quizzes").select("id, lesson_id").order("id").range(from, to),
    ),
  ]);
  const error = subjects.error || modules.error;
  if (error) throw new Error(error.message);
  return {
    subjects: subjects.data ?? [],
    modules: modules.data ?? [],
    lessons,
    quizzes,
  };
}

export function fetchSubmissions(supabase: SupabaseClient, studentId?: string) {
  return fetchAllRows<GbSubmission>((from, to) => {
    let query = supabase
      .from("submissions")
      .select(`student_id, content_id, type, score, submitted_at${studentId ? ", feedback" : ""}`)
      .in("type", [...SCORED_TYPES]);
    if (studentId) query = query.eq("student_id", studentId);
    return query.order("id").range(from, to) as unknown as PromiseLike<{
      data: GbSubmission[] | null;
      error: { message: string } | null;
    }>;
  });
}
