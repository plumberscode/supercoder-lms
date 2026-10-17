// Sumber soal kuis dinamis: dari modul mana (dan kategori apa) soal diambil, dan
// berapa banyak. Disimpan di quizzes.sources (migration_quiz_sources.sql).

export const MAX_SOURCE_COUNT = 100;

export type QuizSource = {
  module_id: string;
  // null = semua kategori di modul itu.
  category: string | null;
  count: number;
};

type SourceQuiz = {
  sources?: unknown;
  target_category?: string | null;
  question_count?: number | null;
};

export function sanitizeSources(raw: unknown): QuizSource[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      module_id: typeof s.module_id === "string" ? s.module_id : "",
      category:
        typeof s.category === "string" && s.category.trim()
          ? s.category.trim()
          : null,
      count: Number(s.count),
    }));
}

// Kuis lama (sources masih null) mengambil soal dari modul materinya.
export function resolveSources(
  quiz: SourceQuiz,
  lessonModuleId: string | null | undefined,
): QuizSource[] {
  const sources = sanitizeSources(quiz.sources);
  if (sources.length) return sources;
  if (!lessonModuleId) return [];
  return [
    {
      module_id: lessonModuleId,
      category: quiz.target_category?.trim() || null,
      count: quiz.question_count || 10,
    },
  ];
}

// Pesan galat untuk admin, atau null bila valid. `available` (opsional) = jumlah
// soal di bank soal untuk sumber tersebut.
export function validateSources(
  sources: QuizSource[],
  available?: (source: QuizSource) => number,
): string | null {
  if (sources.length === 0) return "Tambahkan minimal satu sumber soal.";

  for (const [i, s] of sources.entries()) {
    const label = `Sumber #${i + 1}`;
    if (!s.module_id) return `${label}: pilih modul.`;
    if (
      !Number.isInteger(s.count) ||
      s.count < 1 ||
      s.count > MAX_SOURCE_COUNT
    ) {
      return `${label}: jumlah soal harus 1–${MAX_SOURCE_COUNT}.`;
    }
    if (available) {
      const n = available(s);
      if (n === 0) return `${label}: belum ada soal di bank soal.`;
      if (s.count > n) return `${label}: hanya tersedia ${n} soal.`;
    }
  }

  // Satu soal tidak boleh masuk dua sumber: modul "semua kategori" tidak boleh
  // dipasangkan dengan sumber lain dari modul yang sama.
  for (const [i, s] of sources.entries()) {
    for (const other of sources.slice(i + 1)) {
      if (other.module_id !== s.module_id) continue;
      if (s.category === null || other.category === null) {
        return "Modul yang sama dipilih dua kali dengan “Semua kategori”. Pilih kategori yang berbeda atau gabungkan jumlahnya.";
      }
      if (s.category === other.category) {
        return `Kategori “${s.category}” dari modul yang sama dipilih dua kali.`;
      }
    }
  }
  return null;
}

type BankRow = { module_id: string | null; category: string | null };

function matches(source: QuizSource, row: BankRow) {
  return (
    row.module_id === source.module_id &&
    (source.category === null || row.category?.trim() === source.category)
  );
}

// Soal bank dikelompokkan per sumber (urutan sama dengan `sources`).
export function groupBySource<T extends BankRow>(
  sources: QuizSource[],
  rows: T[],
): T[][] {
  return sources.map((s) => rows.filter((r) => matches(s, r)));
}

export function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickQuestions<T>(sources: QuizSource[], pools: T[][]): T[] {
  return shuffle(
    sources.flatMap((s, i) => shuffle(pools[i]).slice(0, s.count)),
  );
}

// Jawaban valid bila setiap sumber dijawab tepat sebanyak soal yang ditampilkan,
// dan tidak ada soal di luar sumber.
export function answersMatchSources<T extends BankRow & { id: string }>(
  sources: QuizSource[],
  pools: T[][],
  answeredIds: string[],
) {
  const answered = new Set(answeredIds);
  if (answered.size !== answeredIds.length) return false;
  let covered = 0;
  for (const [i, s] of sources.entries()) {
    const hit = pools[i].filter((q) => answered.has(q.id)).length;
    if (hit !== Math.min(s.count, pools[i].length)) return false;
    covered += hit;
  }
  return covered === answered.size;
}
