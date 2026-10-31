import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/fetch-all";

// Nilai minimal agar sebuah materi dihitung "selesai" (sama dengan Buku Nilai).
export const PASS_SCORE = 70;

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const SCORED_TYPES = ["quiz", "project", "lesson", "code", "css", "web"];

// Nilai guru pada materi tanpa bobot XP diisi sebagai jumlah XP materi itu
// (mis. "Figma Recipe Page (20 XP)" diberi 20), bukan skala 0–100. Nilai seperti ini
// berarti materi sudah selesai dan tidak ikut dihitung dalam rata-rata nilai.
export function isXpGrade(type: string, lesson: { xp_reward?: number | null }) {
  return type === "lesson" && !((lesson.xp_reward ?? 0) > 0);
}

export interface ReportSubjectSummary {
  title: string;
  completed: number;
  total: number;
  progressPct: number;
  monthAverage: number | null;
  monthCount: number;
  // Field di bawah tidak ada di snapshot lama.
  completedBefore?: number;
  monthXp?: number;
}

// Asal nilai bulan ini per jenis tugas.
export interface ReportSource {
  type: string;
  label: string;
  lessons: number;
  avg: number | null;
  passed: number;
  xp: number;
  pending: number;
}

export const SOURCE_ORDER = ["quiz", "code", "css", "web", "lesson", "project"] as const;

export const REPORT_SOURCE_LABELS: Record<string, string> = {
  quiz: "Kuis",
  code: "Tantangan Kode",
  css: "Tantangan CSS",
  web: "Tantangan Web",
  lesson: "Nilai Guru",
  project: "Proyek",
};

export interface ReportActivity {
  date: string;
  subject: string;
  lesson: string;
  type: string;
  // Nilai skala 0–100; null bila belum dinilai atau nilainya berupa XP.
  score: number | null;
  // Nilai guru berupa XP (lihat isXpGrade). Tidak ada di snapshot lama.
  xp?: number | null;
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
  // Field di bawah tidak ada di snapshot lama (sebelum Oktober 2026).
  sources?: ReportSource[];
  activeDays?: number;
  longestStreak?: number;
  completedThisMonth?: number;
  previous?: { monthCount: number; monthAverage: number | null };
}

export interface PublicReport {
  period: string;
  snapshot: ReportSnapshot;
  month_note: string | null;
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

// Bulan berjalan menurut WITA.
export function currentPeriod(now = new Date()) {
  return recentPeriods(1, now)[0];
}

export function shiftPeriod(period: string, months: number) {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
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
  lessons: { id: string; module_id: string; title: string; xp_reward?: number | null }[];
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
  const prevStart = periodRange(shiftPeriod(input.period, -1)).start;
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

  // Materi yang sudah selesai sampai akhir periode (untuk progres keseluruhan),
  // dan yang sudah selesai sebelum periode dimulai (untuk "selesai bulan ini").
  const completedLessons = new Set<string>();
  const completedBefore = new Set<string>();
  // Aktivitas bulan ini per materi + tipe.
  const monthly = new Map<string, ReportActivity & { subjectId: string }>();
  // Bulan lalu cukup nilai tertinggi per materi + tipe, untuk perbandingan.
  const previous = new Map<string, number | null>();
  const activeDays = new Set<string>();
  const touchedSubjects = new Set<string>();

  for (const sub of input.submissions) {
    if (sub.submitted_at >= end) continue;
    const lessonId =
      sub.type === "quiz" ? quizToLesson.get(sub.content_id) : sub.content_id;
    const lesson = lessonId ? lessonById.get(lessonId) : undefined;
    const subjectId = lesson ? subjectByModule.get(lesson.module_id) : undefined;
    if (!lesson || !subjectId) continue;

    touchedSubjects.add(subjectId);
    // Nilai guru berupa XP masuk ke `xp`, bukan `score`, agar tidak dibaca sebagai nilai 0–100.
    const xpGrade = isXpGrade(sub.type, lesson);
    const score = xpGrade ? null : sub.score;
    const xp = xpGrade ? sub.score : null;
    const key = `${lesson.id}:${sub.type}`;
    if (xpGrade ? (xp ?? 0) > 0 : score !== null && score >= PASS_SCORE) {
      completedLessons.add(lesson.id);
      if (sub.submitted_at < start) completedBefore.add(lesson.id);
    }

    if (sub.submitted_at < start) {
      if (sub.submitted_at >= prevStart) {
        const best = previous.get(key) ?? null;
        previous.set(key, score === null ? best : Math.max(best ?? score, score));
      }
      continue;
    }

    activeDays.add(witaDay(sub.submitted_at));
    const prev = monthly.get(key);
    if (!prev) {
      monthly.set(key, {
        subjectId,
        subject: subjectTitle.get(subjectId) || "",
        lesson: lesson.title,
        type: sub.type,
        score,
        xp,
        date: sub.submitted_at,
        feedback: sub.feedback || null,
      });
      continue;
    }
    // Simpan nilai tertinggi; tanggal & feedback mengikuti percobaan terbaru yang punya feedback.
    if (score !== null) {
      prev.score = prev.score === null ? score : Math.max(prev.score, score);
    }
    if (xp !== null) {
      prev.xp = Math.max(prev.xp ?? 0, xp);
    }
    if (sub.submitted_at > prev.date) {
      prev.date = sub.submitted_at;
      if (sub.feedback) prev.feedback = sub.feedback;
    } else if (!prev.feedback && sub.feedback) {
      prev.feedback = sub.feedback;
    }
  }

  const activities = [...monthly.values()].sort((a, b) => a.date.localeCompare(b.date));
  const isPassed = (a: ReportActivity) =>
    a.xp != null ? a.xp > 0 : a.score !== null && a.score >= PASS_SCORE;

  const subjects: ReportSubjectSummary[] = input.subjects
    .filter((s) => touchedSubjects.has(s.id))
    .map((s) => {
      const total = lessonCountBySubject.get(s.id) || 0;
      const inSubject = input.lessons.filter((l) => subjectByModule.get(l.module_id) === s.id);
      const completed = inSubject.filter((l) => completedLessons.has(l.id)).length;
      const own = activities.filter((a) => a.subjectId === s.id);
      return {
        title: s.title,
        completed,
        total,
        progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
        monthAverage: average(own.filter((a) => a.score !== null).map((a) => a.score as number)),
        monthCount: own.length,
        completedBefore: inSubject.filter((l) => completedBefore.has(l.id)).length,
        monthXp: own.reduce((n, a) => n + (a.xp ?? 0), 0),
      };
    });

  const sources: ReportSource[] = SOURCE_ORDER.map((type) => {
    const own = activities.filter((a) => a.type === type);
    return {
      type,
      label: REPORT_SOURCE_LABELS[type],
      lessons: own.length,
      avg: average(own.filter((a) => a.score !== null).map((a) => a.score as number)),
      passed: own.filter(isPassed).length,
      xp: own.reduce((n, a) => n + (a.xp ?? 0), 0),
      pending: own.filter((a) => a.score === null && a.xp == null).length,
    };
  }).filter((s) => s.lessons > 0);

  const scoredAll = activities.filter((a) => a.score !== null).map((a) => a.score as number);
  const prevScores = [...previous.values()].filter((v): v is number => v !== null);

  return {
    subjects,
    activities: activities.map(({ subjectId: _subjectId, ...a }) => a),
    totals: {
      monthCount: activities.length,
      monthAverage: average(scoredAll),
      completed: subjects.reduce((n, s) => n + s.completed, 0),
      total: subjects.reduce((n, s) => n + s.total, 0),
    },
    sources,
    activeDays: activeDays.size,
    longestStreak: longestStreak([...activeDays]),
    completedThisMonth: [...completedLessons].filter((id) => !completedBefore.has(id)).length,
    previous: { monthCount: previous.size, monthAverage: average(prevScores) },
  };
}

function witaDay(iso: string) {
  return new Date(Date.parse(iso) + WITA_OFFSET_MS).toISOString().slice(0, 10);
}

function longestStreak(days: string[]) {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const day of sorted) {
    const t = Date.parse(day);
    run = run > 0 && t - prev === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
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

  const [profileRes, submissions, subjectsRes, modulesRes, lessons, quizzes, achievementsRes] =
    await Promise.all([
      supabase.from("profiles").select("full_name, xp, level").eq("id", studentId).single(),
      fetchAllRows<SummarizeInput["submissions"][number]>((from, to) =>
        supabase
          .from("submissions")
          .select("content_id, type, score, feedback, submitted_at")
          .eq("student_id", studentId)
          .in("type", SCORED_TYPES)
          .lt("submitted_at", end)
          .order("id")
          .range(from, to),
      ),
      supabase.from("subjects").select("id, title").order("order_index"),
      supabase.from("modules").select("id, subject_id"),
      fetchAllRows<SummarizeInput["lessons"][number]>((from, to) =>
        supabase.from("lessons").select("id, module_id, title, xp_reward").order("id").range(from, to),
      ),
      fetchAllRows<SummarizeInput["quizzes"][number]>((from, to) =>
        supabase.from("quizzes").select("id, lesson_id").order("id").range(from, to),
      ),
      supabase
        .from("user_achievements")
        .select("earned_at, achievements(title, description)")
        .eq("profile_id", studentId)
        .gte("earned_at", start)
        .lt("earned_at", end),
    ]);

  const firstError = [profileRes, subjectsRes, modulesRes].find(
    (r) => r.error,
  )?.error;
  if (firstError) throw new Error(`Gagal memuat data rapor: ${firstError.message}`);

  const summary = summarizeSubmissions({
    period,
    subjects: subjectsRes.data || [],
    modules: modulesRes.data || [],
    lessons,
    quizzes,
    submissions,
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

export type NoteField = "month_note" | "strengths" | "improvements" | "parent_advice";

export interface NoteHint {
  field: NoteField;
  label: string;
  text: string;
}

// Kalimat awal untuk catatan guru, disusun dari data rapor. Guru tinggal memilih lalu menyunting.
export function buildNoteHints(snapshot: ReportSnapshot): NoteHint[] {
  const name = snapshot.student.name.split(/\s+/)[0] || "Ananda";
  const hints: NoteHint[] = [];
  const { totals, activities } = snapshot;
  const days = snapshot.activeDays ?? 0;
  const done = snapshot.completedThisMonth ?? 0;

  if (activities.length === 0) {
    hints.push({
      field: "month_note",
      label: "Tidak ada tugas LMS bulan ini",
      text: `Bulan ini ${name} belum mengerjakan tugas di LMS karena [ALASAN, mis. fokus persiapan lomba].`,
    });
  } else {
    hints.push({
      field: "month_note",
      label: `Aktif ${days} hari bulan ini`,
      text: `Bulan ini ${name} aktif belajar selama ${days} hari dan menyelesaikan ${done} materi.`,
    });
  }

  const best = (snapshot.sources ?? [])
    .filter((s) => s.avg !== null && s.avg >= 80)
    .sort((a, b) => (b.avg as number) - (a.avg as number))[0];
  if (best) {
    hints.push({
      field: "strengths",
      label: `Paling kuat: ${best.label} (${best.avg})`,
      text: `Nilai ${best.label.toLowerCase()} sangat baik, rata-rata ${best.avg}.`,
    });
  }

  const prevAvg = snapshot.previous?.monthAverage ?? null;
  const delta = totals.monthAverage !== null && prevAvg !== null ? totals.monthAverage - prevAvg : null;
  if (delta !== null && delta > 0) {
    hints.push({
      field: "strengths",
      label: `Rata-rata naik ${delta} poin`,
      text: `Rata-rata nilainya naik dari ${prevAvg} bulan lalu menjadi ${totals.monthAverage}.`,
    });
  }

  const topSubject = [...snapshot.subjects]
    .map((s) => ({ ...s, gained: s.completedBefore === undefined ? 0 : s.completed - s.completedBefore }))
    .sort((a, b) => b.gained - a.gained)[0];
  if (topSubject && topSubject.gained >= 3) {
    hints.push({
      field: "strengths",
      label: `${topSubject.gained} materi ${topSubject.title} selesai`,
      text: `Bulan ini ${name} menyelesaikan ${topSubject.gained} materi ${topSubject.title}.`,
    });
  }

  const low = activities
    .filter((a) => a.score !== null && a.score < PASS_SCORE)
    .sort((a, b) => (a.score as number) - (b.score as number))
    .slice(0, 2);
  for (const a of low) {
    hints.push({
      field: "improvements",
      label: `Perlu diulang: ${a.lesson} (${a.score})`,
      text: `Materi "${a.lesson}" (${a.subject}) perlu diulang; nilainya masih ${a.score}.`,
    });
  }

  if (delta !== null && delta < 0) {
    hints.push({
      field: "improvements",
      label: `Rata-rata turun ${-delta} poin`,
      text: `Rata-rata nilainya turun dari ${prevAvg} bulan lalu menjadi ${totals.monthAverage}.`,
    });
  }

  if (activities.length > 0 && days > 0 && days < 4) {
    hints.push({
      field: "improvements",
      label: `Baru aktif ${days} hari`,
      text: `Perlu lebih rutin berlatih; bulan ini ${name} baru aktif ${days} hari.`,
    });
  }

  const showcase = [...activities]
    .reverse()
    .find((a) => a.type === "project" || (a.xp ?? 0) > 0);
  if (showcase) {
    hints.push({
      field: "parent_advice",
      label: `Ajak cerita: ${showcase.lesson}`,
      text: `Ajak ${name} menunjukkan "${showcase.lesson}" yang ia kerjakan bulan ini.`,
    });
  }
  if (low[0]) {
    hints.push({
      field: "parent_advice",
      label: `Latihan di rumah: ${low[0].lesson}`,
      text: `Dampingi ${name} mengulang materi "${low[0].lesson}" di rumah, 15–20 menit beberapa kali seminggu.`,
    });
  }

  return hints;
}
