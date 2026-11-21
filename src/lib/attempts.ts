// Jatah penilaian soal coding (CSS, Web, HTML+JS). Riwayat percobaan disimpan di
// submissions.data.attempts; admin bisa mereset jatah lewat attempts_reset_at tanpa
// menghapus riwayat. Dipakai bersama oleh server (penilaian) dan komponen siswa.

export const MAX_ATTEMPTS = 3;

/** Tipe submission yang dibatasi jatah penilaiannya. */
export const LIMITED_SUBMISSION_TYPES = ["css", "web", "code"] as const;

function attemptList(attempts: unknown): { at?: unknown }[] {
  return Array.isArray(attempts) ? attempts : [];
}

/** Jumlah seluruh percobaan, termasuk yang sebelum reset. */
export function totalAttempts(attempts: unknown): number {
  return attemptList(attempts).length;
}

/**
 * Jumlah percobaan yang memakai jatah saat ini: hanya yang terjadi setelah reset
 * terakhir. Percobaan tanpa waktu dianggap terjadi sebelum reset.
 */
export function attemptsSinceReset(
  attempts: unknown,
  resetAt: string | null | undefined,
): number {
  const list = attemptList(attempts);
  const resetMs = resetAt ? Date.parse(resetAt) : NaN;
  if (Number.isNaN(resetMs)) return list.length;
  return list.filter((a) => {
    const at = typeof a?.at === "string" ? Date.parse(a.at) : NaN;
    return !Number.isNaN(at) && at > resetMs;
  }).length;
}

export function attemptLimitMessage() {
  return `Batas submit sudah tercapai (${MAX_ATTEMPTS}/${MAX_ATTEMPTS})`;
}

const SOURCE_LABEL: Record<string, string> = { css: "CSS", web: "Web", code: "HTML+JS" };

export interface AttemptQuotaRow {
  submissionId: string;
  lessonTitle: string;
  source: string;
  used: number;
  total: number;
  resetCount: number;
  resetAt: string | null;
}

/**
 * Baris panel "Jatah penilaian soal coding" di Buku Nilai. Hanya kiriman yang punya
 * riwayat percobaan (soal Python/JS biasa tidak punya batas, jadi tidak ikut).
 * Urutan: jatah habis dulu, lalu yang paling banyak terpakai, lalu judul.
 */
export function buildAttemptQuota(
  submissions: {
    id: string;
    content_id: string;
    type: string;
    attempts: unknown;
    attempts_reset_at: string | null;
    attempts_reset_count: number | null;
  }[],
  lessons: { id: string; title: string }[],
): AttemptQuotaRow[] {
  const titles = new Map(lessons.map((l) => [l.id, l.title]));
  return submissions
    .filter((s) => SOURCE_LABEL[s.type] && totalAttempts(s.attempts) > 0)
    .map((s) => ({
      submissionId: s.id,
      lessonTitle: titles.get(s.content_id) ?? "Materi tidak ditemukan",
      source: SOURCE_LABEL[s.type],
      used: Math.min(attemptsSinceReset(s.attempts, s.attempts_reset_at), MAX_ATTEMPTS),
      total: totalAttempts(s.attempts),
      resetCount: s.attempts_reset_count ?? 0,
      resetAt: s.attempts_reset_at,
    }))
    .sort(
      (a, b) =>
        Number(b.used >= MAX_ATTEMPTS) - Number(a.used >= MAX_ATTEMPTS) ||
        b.used - a.used ||
        a.lessonTitle.localeCompare(b.lessonTitle, "id"),
    );
}
