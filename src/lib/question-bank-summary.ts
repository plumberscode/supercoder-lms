import type { SupabaseClient } from "@supabase/supabase-js";

export interface ModuleOption {
  id: string;
  title: string;
  subjectTitle: string;
}

// Jumlah soal bank per modul, dirinci per kategori.
export type QuestionBankSummary = Record<
  string,
  { total: number; categories: { name: string; count: number }[] }
>;

// Semua modul, diurutkan mengikuti mata pelajarannya lalu urutan modul.
export async function getModuleOptions(
  supabase: SupabaseClient,
): Promise<ModuleOption[]> {
  const { data } = await supabase
    .from("modules")
    .select("id, title, order_index, subjects(title, order_index)");

  return (data ?? [])
    .map((m) => {
      const subject = Array.isArray(m.subjects) ? m.subjects[0] : m.subjects;
      return {
        id: m.id as string,
        title: m.title as string,
        subjectTitle: (subject?.title as string) ?? "Tanpa Mata Pelajaran",
        subjectOrder: (subject?.order_index as number) ?? 0,
        order: (m.order_index as number) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        a.subjectOrder - b.subjectOrder ||
        a.subjectTitle.localeCompare(b.subjectTitle) ||
        a.order - b.order,
    )
    .map(({ id, title, subjectTitle }) => ({ id, title, subjectTitle }));
}

export async function getQuestionBankSummary(
  supabase: SupabaseClient,
): Promise<QuestionBankSummary> {
  const { data } = await supabase
    .from("question_bank")
    .select("module_id, category");

  const counts = new Map<string, Map<string, number>>();
  for (const row of data ?? []) {
    if (!row.module_id) continue;
    const byCategory = counts.get(row.module_id) ?? new Map<string, number>();
    const name = (row.category as string | null)?.trim() || "";
    byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
    counts.set(row.module_id, byCategory);
  }

  const summary: QuestionBankSummary = {};
  for (const [moduleId, byCategory] of counts) {
    const categories = [...byCategory]
      .filter(([name]) => name)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    summary[moduleId] = {
      total: [...byCategory.values()].reduce((a, b) => a + b, 0),
      categories,
    };
  }
  return summary;
}

export function availableCount(
  summary: QuestionBankSummary,
  source: { module_id: string; category: string | null },
) {
  const moduleSummary = summary[source.module_id];
  if (!moduleSummary) return 0;
  if (source.category === null) return moduleSummary.total;
  return (
    moduleSummary.categories.find((c) => c.name === source.category)?.count ?? 0
  );
}
