import { PASS_SCORE, isXpGrade } from "@/lib/reports";

// Tipe submission yang menghasilkan nilai, sama dengan rapor bulanan.
export const SCORED_TYPES = ["quiz", "code", "css", "web", "lesson", "project"] as const;

export const SOURCE_LABELS: Record<string, string> = {
  quiz: "Kuis",
  code: "Coding",
  css: "CSS",
  web: "Web",
  lesson: "Nilai Guru",
  project: "Project",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
export const INACTIVE_DAYS = 7;
const WEEKS = 8;

export interface GbSubject {
  id: string;
  title: string;
}
export interface GbModule {
  id: string;
  subject_id: string;
  title: string;
  order_index: number;
  programs: string[] | null;
}
export interface GbLesson {
  id: string;
  module_id: string;
  title: string;
  type: string;
  order_index: number;
  xp_reward?: number | null;
}
export interface GbQuiz {
  id: string;
  lesson_id: string | null;
}
export interface GbSubmission {
  student_id: string;
  content_id: string;
  type: string;
  score: number | null;
  submitted_at: string;
  feedback?: string | null;
}
export interface GbStudent {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  program: string | null;
  xp: number | null;
  level: number | null;
}

export interface CatalogInput {
  subjects: GbSubject[];
  modules: GbModule[];
  lessons: GbLesson[];
  quizzes: GbQuiz[];
  // Bila diisi, hanya materi dari mapel ini yang dihitung.
  subjectId?: string;
}

interface CatalogLesson extends GbLesson {
  subjectId: string;
  subjectTitle: string;
  modulePrograms: string[];
}

// Peta materi yang dipakai bersama ringkasan dan profil siswa.
function buildCatalog(input: CatalogInput) {
  const subjectTitle = new Map(input.subjects.map((s) => [s.id, s.title]));
  const moduleById = new Map(
    input.modules
      .filter((m) => !input.subjectId || m.subject_id === input.subjectId)
      .map((m) => [m.id, m]),
  );
  const lessonById = new Map<string, CatalogLesson>();
  for (const lesson of input.lessons) {
    const mod = moduleById.get(lesson.module_id);
    if (!mod || !subjectTitle.has(mod.subject_id)) continue;
    lessonById.set(lesson.id, {
      ...lesson,
      subjectId: mod.subject_id,
      subjectTitle: subjectTitle.get(mod.subject_id) || "",
      // Modul lama tanpa kolom programs dianggap khusus Supercoder.
      modulePrograms: mod.programs ?? ["supercoder"],
    });
  }
  // Submission kuis menyimpan quiz.id sebagai content_id, tipe lain menyimpan lesson.id.
  const quizToLesson = new Map(input.quizzes.map((q) => [q.id, q.lesson_id]));

  const programTotals = new Map<string, number>();
  const totalFor = (program: string | null) => {
    const key = program || "supercoder";
    if (!programTotals.has(key)) {
      let n = 0;
      for (const l of lessonById.values()) if (l.modulePrograms.includes(key)) n++;
      programTotals.set(key, n);
    }
    return programTotals.get(key)!;
  };

  const resolve = (sub: GbSubmission) => {
    const lessonId = sub.type === "quiz" ? quizToLesson.get(sub.content_id) : sub.content_id;
    return lessonId ? lessonById.get(lessonId) : undefined;
  };

  return { lessonById, moduleById, resolve, totalFor };
}

export function scoreTone(score: number | null | undefined) {
  if (score === null || score === undefined) return "none" as const;
  if (score >= PASS_SCORE) return "good" as const;
  return score >= 50 ? ("warn" as const) : ("bad" as const);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// Satu percobaan yang sudah dinormalisasi: `score` hanya berisi nilai skala 0–100,
// sedangkan nilai guru yang berupa jumlah XP masuk ke `xp`.
interface Attempt {
  lessonId: string;
  score: number | null;
  xp: number | null;
  passed: boolean;
  at: number;
}

function toAttempt(sub: GbSubmission, lesson: CatalogLesson): Attempt {
  const at = Date.parse(sub.submitted_at);
  if (isXpGrade(sub.type, lesson)) {
    return { lessonId: lesson.id, score: null, xp: sub.score, passed: (sub.score ?? 0) > 0, at };
  }
  return {
    lessonId: lesson.id,
    score: sub.score,
    xp: null,
    passed: sub.score !== null && sub.score >= PASS_SCORE,
    at,
  };
}

// Rata-rata nilai tertinggi per materi untuk percobaan dalam rentang [from, to).
function windowAverage(attempts: Attempt[], from: number, to: number) {
  const best = new Map<string, number>();
  for (const s of attempts) {
    if (s.score === null || s.at < from || s.at >= to) continue;
    best.set(s.lessonId, Math.max(best.get(s.lessonId) ?? 0, s.score));
  }
  return average([...best.values()]);
}

interface LessonStats {
  best: number | null;
  xp: number | null;
  passed: boolean;
  firstPassAt: number | null;
  attempts: number;
  lastAt: number;
}

function lessonStats(attempts: Attempt[]) {
  const stats = new Map<string, LessonStats>();
  for (const s of attempts) {
    const cur = stats.get(s.lessonId) ?? {
      best: null,
      xp: null,
      passed: false,
      firstPassAt: null,
      attempts: 0,
      lastAt: 0,
    };
    cur.attempts++;
    cur.lastAt = Math.max(cur.lastAt, s.at);
    if (s.score !== null) cur.best = Math.max(cur.best ?? 0, s.score);
    if (s.xp !== null) cur.xp = Math.max(cur.xp ?? 0, s.xp);
    if (s.passed) {
      cur.passed = true;
      if (cur.firstPassAt === null || s.at < cur.firstPassAt) cur.firstPassAt = s.at;
    }
    stats.set(s.lessonId, cur);
  }
  return stats;
}

export interface GradebookRow {
  id: string;
  name: string;
  username: string | null;
  email: string;
  program: string;
  xp: number;
  level: number;
  lastActivityAt: string | null;
  lastLesson: {
    title: string;
    subject: string;
    source: string;
    score: number | null;
    xp: number | null;
  } | null;
  done: number;
  total: number;
  pct: number;
  avg30: number | null;
  avgPrev30: number | null;
  // Jumlah submission per 7 hari, dari yang terlama ke minggu ini.
  weekly: number[];
  passedThisWeek: number;
  failing: number;
  attention: string | null;
}

export function summarizeStudents(
  input: CatalogInput & { students: GbStudent[]; submissions: GbSubmission[]; now: Date },
): GradebookRow[] {
  // Aktivitas (terakhir aktif, materi terakhir, grafik mingguan) selalu dari semua mapel;
  // nilai dan progres mengikuti mapel yang dipilih.
  const fullCatalog = buildCatalog({ ...input, subjectId: undefined });
  const catalog = buildCatalog(input);
  const now = input.now.getTime();

  const byStudent = new Map<string, { lessonId: string; sub: GbSubmission; attempt: Attempt; at: number }[]>();
  for (const sub of input.submissions) {
    const lesson = fullCatalog.resolve(sub);
    if (!lesson) continue;
    const list = byStudent.get(sub.student_id) ?? [];
    const attempt = toAttempt(sub, lesson);
    list.push({ lessonId: lesson.id, sub, attempt, at: attempt.at });
    byStudent.set(sub.student_id, list);
  }

  return input.students.map((student) => {
    const program = student.program || "supercoder";
    const entries = byStudent.get(student.id) ?? [];
    const flat = entries.filter((e) => catalog.lessonById.has(e.lessonId)).map((e) => e.attempt);
    const stats = lessonStats(flat);
    const total = catalog.totalFor(program);

    let done = 0;
    let failing = 0;
    let passedThisWeek = 0;
    for (const [lessonId, s] of stats) {
      const accessible = catalog.lessonById.get(lessonId)?.modulePrograms.includes(program);
      if (s.passed) {
        if (accessible) done++;
        if (s.firstPassAt !== null && s.firstPassAt >= now - INACTIVE_DAYS * DAY_MS) passedThisWeek++;
      } else if (s.best !== null) {
        failing++;
      }
    }

    const last = entries.reduce<(typeof entries)[number] | null>(
      (acc, e) => (!acc || e.at > acc.at ? e : acc),
      null,
    );
    const lastLesson = last ? fullCatalog.lessonById.get(last.lessonId)! : null;

    const weekly = new Array(WEEKS).fill(0);
    for (const e of entries) {
      const week = Math.floor((now - e.at) / (7 * DAY_MS));
      if (week >= 0 && week < WEEKS) weekly[WEEKS - 1 - week]++;
    }

    const avg30 = windowAverage(flat, now - 30 * DAY_MS, now + 1);
    const avgPrev30 = windowAverage(flat, now - 60 * DAY_MS, now - 30 * DAY_MS);

    let attention: string | null = null;
    if (!last) {
      attention = "Belum pernah mengerjakan";
    } else {
      const idleDays = Math.floor((now - last.at) / DAY_MS);
      if (idleDays >= INACTIVE_DAYS) attention = `Tidak aktif ${idleDays} hari`;
      else if (avg30 !== null && avg30 < PASS_SCORE) attention = "Rata-rata di bawah 70";
      else if (failing >= 3) attention = `${failing} materi belum lulus`;
    }

    return {
      id: student.id,
      name: student.full_name || "Tanpa Nama",
      username: student.username,
      email: student.email,
      program,
      xp: student.xp ?? 0,
      level: student.level ?? 1,
      lastActivityAt: last ? last.sub.submitted_at : null,
      lastLesson:
        last && lastLesson
          ? {
              title: lastLesson.title,
              subject: lastLesson.subjectTitle,
              source: SOURCE_LABELS[last.sub.type] || last.sub.type,
              score: last.attempt.score,
              xp: last.attempt.xp,
            }
          : null,
      done,
      total,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      avg30,
      avgPrev30,
      weekly,
      passedThisWeek,
      failing,
      attention,
    };
  });
}

// "2026-10-31" menurut WITA.
function witaDay(ms: number) {
  return new Date(ms + WITA_OFFSET_MS).toISOString().slice(0, 10);
}

export interface ProfileLesson {
  id: string;
  title: string;
  type: string;
  score: number | null;
  xp: number | null;
  passed: boolean;
  attempts: number;
}

export interface StudentProfile {
  done: number;
  total: number;
  pct: number;
  avg: number | null;
  avg30: number | null;
  avgPrev30: number | null;
  attempts: number;
  lessonsAttempted: number;
  passedThisWeek: number;
  activeDaysThisMonth: number;
  longestStreakThisMonth: number;
  lastActivity: { at: string; lesson: string } | null;
  sources: {
    type: string;
    label: string;
    lessons: number;
    avg: number | null;
    passed: number;
    // Materi dan total XP dari nilai guru yang diisi sebagai XP (lihat isXpGrade).
    xpLessons: number;
    xp: number;
  }[];
  timeline: {
    at: string;
    lesson: string;
    subject: string;
    source: string;
    score: number | null;
    xp: number | null;
    attempt: number;
    feedback: string | null;
  }[];
  retry: { id: string; title: string; subject: string; score: number; attempts: number; lastAt: string }[];
  subjects: {
    id: string;
    title: string;
    done: number;
    total: number;
    pct: number;
    attempted: boolean;
    modules: { id: string; title: string; lessons: ProfileLesson[] }[];
  }[];
}

export function buildStudentProfile(
  input: CatalogInput & {
    program: string | null;
    submissions: GbSubmission[];
    now: Date;
    timelineLimit?: number;
  },
): StudentProfile {
  const catalog = buildCatalog(input);
  const program = input.program || "supercoder";
  const now = input.now.getTime();

  const entries = input.submissions
    .flatMap((sub) => {
      const lesson = catalog.resolve(sub);
      if (!lesson) return [];
      const attempt = toAttempt(sub, lesson);
      return [{ sub, lesson, attempt, at: attempt.at }];
    })
    .sort((a, b) => a.at - b.at);
  const flat = entries.map((e) => e.attempt);
  const stats = lessonStats(flat);

  // Percobaan ke-n dihitung per materi + sumber, urut waktu.
  const attemptCounter = new Map<string, number>();
  const withAttempt = entries.map((e) => {
    const key = `${e.lesson.id}:${e.sub.type}`;
    const n = (attemptCounter.get(key) ?? 0) + 1;
    attemptCounter.set(key, n);
    return { ...e, nth: n };
  });

  // Statistik per sumber nilai: materi yang punya nilai/XP dari sumber itu.
  const bySource = new Map<string, Map<string, LessonStats>>();
  for (const type of SCORED_TYPES) {
    const attempts = entries
      .filter((e) => e.sub.type === type && (e.attempt.score !== null || e.attempt.xp !== null))
      .map((e) => e.attempt);
    bySource.set(type, lessonStats(attempts));
  }
  const sources = SCORED_TYPES.map((type) => {
    const perLesson = [...bySource.get(type)!.values()];
    return {
      type,
      label: SOURCE_LABELS[type],
      lessons: perLesson.length,
      avg: average(perLesson.filter((s) => s.best !== null).map((s) => s.best as number)),
      passed: perLesson.filter((s) => s.passed).length,
      xpLessons: perLesson.filter((s) => s.xp !== null).length,
      xp: perLesson.reduce((n, s) => n + (s.xp ?? 0), 0),
    };
  });

  const accessible = [...catalog.lessonById.values()].filter((l) => l.modulePrograms.includes(program));
  const lessonView = (l: CatalogLesson): ProfileLesson => ({
    id: l.id,
    title: l.title,
    type: l.type,
    score: stats.get(l.id)?.best ?? null,
    xp: stats.get(l.id)?.xp ?? null,
    passed: stats.get(l.id)?.passed ?? false,
    attempts: stats.get(l.id)?.attempts ?? 0,
  });

  const subjectIds = [...new Set(accessible.map((l) => l.subjectId))];
  const subjects = input.subjects
    .filter((s) => subjectIds.includes(s.id))
    .map((s) => {
      const modules = [...catalog.moduleById.values()]
        .filter((m) => m.subject_id === s.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((m) => ({
          id: m.id,
          title: m.title,
          lessons: accessible
            .filter((l) => l.module_id === m.id)
            .sort((a, b) => a.order_index - b.order_index)
            .map(lessonView),
        }))
        .filter((m) => m.lessons.length > 0);
      const lessons = modules.flatMap((m) => m.lessons);
      const done = lessons.filter((l) => l.passed).length;
      return {
        id: s.id,
        title: s.title,
        done,
        total: lessons.length,
        pct: lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0,
        attempted: lessons.some((l) => l.attempts > 0),
        modules,
      };
    })
    // Mapel yang sudah disentuh tampil lebih dulu.
    .sort((a, b) => Number(b.attempted) - Number(a.attempted));

  const total = accessible.length;
  const done = accessible.filter((l) => stats.get(l.id)?.passed).length;

  // Materi dengan nilai 0–100 di bawah batas lulus, dan belum diselesaikan lewat sumber lain.
  const retry = [...stats.entries()]
    .filter(([, s]) => !s.passed && s.best !== null)
    .map(([id, s]) => {
      const l = catalog.lessonById.get(id)!;
      return {
        id,
        title: l.title,
        subject: l.subjectTitle,
        score: s.best as number,
        attempts: s.attempts,
        lastAt: new Date(s.lastAt).toISOString(),
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const thisMonth = witaDay(now).slice(0, 7);
  const days = [...new Set(entries.map((e) => witaDay(e.at)).filter((d) => d.startsWith(thisMonth)))].sort();
  let longest = 0;
  let run = 0;
  days.forEach((d, i) => {
    const consecutive = i > 0 && Date.parse(d) - Date.parse(days[i - 1]) === DAY_MS;
    run = consecutive ? run + 1 : 1;
    longest = Math.max(longest, run);
  });

  const bestScores = [...stats.values()].filter((s) => s.best !== null).map((s) => s.best as number);
  const last = entries[entries.length - 1];

  return {
    done,
    total,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
    avg: average(bestScores),
    avg30: windowAverage(flat, now - 30 * DAY_MS, now + 1),
    avgPrev30: windowAverage(flat, now - 60 * DAY_MS, now - 30 * DAY_MS),
    attempts: entries.length,
    lessonsAttempted: stats.size,
    passedThisWeek: [...stats.values()].filter(
      (s) => s.firstPassAt !== null && s.firstPassAt >= now - INACTIVE_DAYS * DAY_MS,
    ).length,
    activeDaysThisMonth: days.length,
    longestStreakThisMonth: longest,
    lastActivity: last ? { at: last.sub.submitted_at, lesson: last.lesson.title } : null,
    sources,
    timeline: withAttempt
      .slice()
      .reverse()
      .slice(0, input.timelineLimit ?? 20)
      .map((e) => ({
        at: e.sub.submitted_at,
        lesson: e.lesson.title,
        subject: e.lesson.subjectTitle,
        source: SOURCE_LABELS[e.sub.type] || e.sub.type,
        score: e.attempt.score,
        xp: e.attempt.xp,
        attempt: e.nth,
        feedback: e.sub.feedback || null,
      })),
    retry,
    subjects,
  };
}

// Waktu relatif singkat dalam bahasa Indonesia, mis. "2 jam lalu".
export function relativeTime(iso: string | null, now: Date) {
  if (!iso) return "Belum pernah";
  const diff = now.getTime() - Date.parse(iso);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months} bulan lalu` : `${Math.floor(months / 12)} tahun lalu`;
}

export function formatWita(iso: string, withTime = true) {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Makassar",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
