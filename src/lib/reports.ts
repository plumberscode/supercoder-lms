import type { SupabaseClient } from "@supabase/supabase-js";

// Nilai minimal agar sebuah materi dihitung "selesai" (sama dengan Buku Nilai).
export const PASS_SCORE = 70;

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const SCORED_TYPES = ["quiz", "project", "lesson", "code", "css", "web"];

export interface ReportSubjectSummary {
  title: string;
  completed: number;
  total: number;
  progressPct: number;
  monthAverage: number | null;
  monthCount: number;
}

export interface ReportActivity {
  date: string;
  subject: string;
  lesson: string;
  type: string;
  score: number | null;
  feedback: string | null;
}

export interface ReportSnapshot {
  period: string;
  student: { name: string; xp: number; level: number };
  totals: {
    monthCount: number;
    monthAverage: number | null;
    completed: number;
    total: number;
  };
  subjects: ReportSubjectSummary[];
  activities: ReportActivity[];
  achievements: { title: string; description: string | null; earnedAt: string }[];
}

export interface PublicReport {
  period: string;
  snapshot: ReportSnapshot;
  strengths: string | null;
  improvements: string | null;
  parent_advice: string | null;
  published_at: string | null;
  parent_name: string | null;
}

// "2026-09" atau "2026-09-01" -> "2026-09-01"; null jika formatnya salah.
export function normalizePeriod(input: string | null | undefined) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])/.exec(input || "");
  return match ? `${match[1]}-${match[2]}-01` : null;
}

// Batas bulan dalam WITA (UTC+8, tanpa DST), dikembalikan sebagai ISO UTC.
export function periodRange(period: string) {
  const [y, m] = period.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - WITA_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, 1) - WITA_OFFSET_MS);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function formatPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Bulan lalu menurut WITA, dipakai sebagai pilihan default di halaman admin.
export function previousPeriod(now = new Date()) {
  const wita = new Date(now.getTime() + WITA_OFFSET_MS);
  const d = new Date(Date.UTC(wita.getUTCFullYear(), wita.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 10);
}

export function recentPeriods(count: number, now = new Date()) {
  const wita = new Date(now.getTime() + WITA_OFFSET_MS);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(wita.getUTCFullYear(), wita.getUTCMonth() - i, 1))
      .toISOString()
      .slice(0, 10),
  );
}

interface SummarizeInput {
  period: string;
  subjects: { id: string; title: string }[];
  modules: { id: string; subject_id: string }[];
  lessons: { id: string; module_id: string; title: string }[];
  quizzes: { id: string; lesson_id: string | null }[];
  submissions: {
    content_id: string;
    type: string;
    score: number | null;
    feedback: string | null;
    submitted_at: string;
  }[];
}

// Ringkasan murni dari data mentah. Submission kuis menyimpan quiz.id sebagai content_id,
// tipe lain menyimpan lesson.id, jadi keduanya dipetakan ke materi terlebih dahulu.
export function summarizeSubmissions(input: SummarizeInput) {
  const { start, end } = periodRange(input.period);
  const quizToLesson = new Map(input.quizzes.map((q) => [q.id, q.lesson_id]));
  const lessonById = new Map(input.lessons.map((l) => [l.id, l]));
  const subjectByModule = new Map(input.modules.map((m) => [m.id, m.subject_id]));
  const subjectTitle = new Map(input.subjects.map((s) => [s.id, s.title]));

  const lessonCountBySubject = new Map<string, number>();
  for (const lesson of input.lessons) {
    const subjectId = subjectByModule.get(lesson.module_id);
    if (!subjectId) continue;
    lessonCountBySubject.set(subjectId, (lessonCountBySubject.get(subjectId) || 0) + 1);
  }

  // Nilai tertinggi per materi sampai akhir periode (untuk progres keseluruhan).
  const bestScore = new Map<string, number>();
  // Aktivitas bulan ini per materi + tipe.
  const monthly = new Map<string, ReportActivity & { subjectId: string }>();
  const touchedSubjects = new Set<string>();

  for (const sub of input.submissions) {
    if (sub.submitted_at >= end) continue;
    const lessonId =
      sub.type === "quiz" ? quizToLesson.get(sub.content_id) : sub.content_id;
    const lesson = lessonId ? lessonById.get(lessonId) : undefined;
    const subjectId = lesson ? subjectByModule.get(lesson.module_id) : undefined;
    if (!lesson || !subjectId) continue;

    touchedSubjects.add(subjectId);
    if (sub.score !== null) {
      bestScore.set(lesson.id, Math.max(bestScore.get(lesson.id) ?? 0, sub.score));
    }

    if (sub.submitted_at < start) continue;
    const key = `${lesson.id}:${sub.type}`;
    const prev = monthly.get(key);
    if (!prev) {
      monthly.set(key, {
        subjectId,
        subject: subjectTitle.get(subjectId) || "",
        lesson: lesson.title,
        type: sub.type,
        score: sub.score,
        date: sub.submitted_at,
        feedback: sub.feedback || null,
      });
      continue;
    }
    // Simpan nilai tertinggi; tanggal & feedback mengikuti percobaan terbaru yang punya feedback.
    if (sub.score !== null) {
      prev.score = prev.score === null ? sub.score : Math.max(prev.score, sub.score);
    }
    if (sub.submitted_at > prev.date) {
      prev.date = sub.submitted_at;
      if (sub.feedback) prev.feedback = sub.feedback;
    } else if (!prev.feedback && sub.feedback) {
      prev.feedback = sub.feedback;
    }
  }

  const activities = [...monthly.values()].sort((a, b) => a.date.localeCompare(b.date));

  const subjects: ReportSubjectSummary[] = input.subjects
    .filter((s) => touchedSubjects.has(s.id))
    .map((s) => {
      const total = lessonCountBySubject.get(s.id) || 0;
      const completed = input.lessons.filter(
        (l) =>
          subjectByModule.get(l.module_id) === s.id &&
          (bestScore.get(l.id) ?? -1) >= PASS_SCORE,
      ).length;
      const scored = activities.filter((a) => a.subjectId === s.id && a.score !== null);
      return {
        title: s.title,
        completed,
        total,
        progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
        monthAverage: average(scored.map((a) => a.score as number)),
        monthCount: activities.filter((a) => a.subjectId === s.id).length,
      };
    });

  const scoredAll = activities.filter((a) => a.score !== null).map((a) => a.score as number);

  return {
    subjects,
    activities: activities.map(({ subjectId: _subjectId, ...a }) => a),
    totals: {
      monthCount: activities.length,
      monthAverage: average(scoredAll),
      completed: subjects.reduce((n, s) => n + s.completed, 0),
      total: subjects.reduce((n, s) => n + s.total, 0),
    },
  };
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export async function buildReportSnapshot(
  supabase: SupabaseClient,
  studentId: string,
  period: string,
): Promise<ReportSnapshot> {
  const { start, end } = periodRange(period);

  const [profileRes, submissionsRes, subjectsRes, modulesRes, lessonsRes, quizzesRes, achievementsRes] =
    await Promise.all([
      supabase.from("profiles").select("full_name, xp, level").eq("id", studentId).single(),
      supabase
        .from("submissions")
        .select("content_id, type, score, feedback, submitted_at")
        .eq("student_id", studentId)
        .in("type", SCORED_TYPES)
        .lt("submitted_at", end),
      supabase.from("subjects").select("id, title").order("order_index"),
      supabase.from("modules").select("id, subject_id"),
      supabase.from("lessons").select("id, module_id, title"),
      supabase.from("quizzes").select("id, lesson_id"),
      supabase
        .from("user_achievements")
        .select("earned_at, achievements(title, description)")
        .eq("profile_id", studentId)
        .gte("earned_at", start)
        .lt("earned_at", end),
    ]);

  const firstError = [profileRes, submissionsRes, subjectsRes, modulesRes, lessonsRes, quizzesRes].find(
    (r) => r.error,
  )?.error;
  if (firstError) throw new Error(`Gagal memuat data rapor: ${firstError.message}`);

  const summary = summarizeSubmissions({
    period,
    subjects: subjectsRes.data || [],
    modules: modulesRes.data || [],
    lessons: lessonsRes.data || [],
    quizzes: quizzesRes.data || [],
    submissions: submissionsRes.data || [],
  });

  const achievements = (achievementsRes.data || []).map((row: any) => {
    const a = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
    return {
      title: a?.title || "Pencapaian",
      description: a?.description || null,
      earnedAt: row.earned_at,
    };
  });

  return {
    period,
    student: {
      name: profileRes.data?.full_name || "Siswa",
      xp: profileRes.data?.xp || 0,
      level: profileRes.data?.level || 1,
    },
    ...summary,
    achievements,
  };
}
