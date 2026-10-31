import { describe, it, expect } from "vitest";
import { buildStudentProfile, relativeTime, scoreTone, summarizeStudents } from "@/lib/gradebook";

const NOW = new Date("2026-10-31T06:00:00Z"); // 31 Okt 14.00 WITA
const daysAgo = (n: number, hours = 0) =>
  new Date(NOW.getTime() - n * 86400000 - hours * 3600000).toISOString();

const catalog = {
  subjects: [
    { id: "s1", title: "Python" },
    { id: "s2", title: "Web" },
  ],
  modules: [
    { id: "m1", subject_id: "s1", title: "Dasar", order_index: 1, programs: ["supercoder", "minas"] },
    { id: "m2", subject_id: "s1", title: "Lanjut", order_index: 2, programs: null },
    { id: "m3", subject_id: "s2", title: "HTML", order_index: 1, programs: ["minas"] },
  ],
  lessons: [
    { id: "l1", module_id: "m1", title: "Print", type: "code", order_index: 1 },
    { id: "l2", module_id: "m1", title: "Kuis Dasar", type: "quiz", order_index: 2 },
    { id: "l3", module_id: "m2", title: "Fungsi", type: "code", order_index: 1 },
    { id: "l4", module_id: "m3", title: "Tag", type: "html", order_index: 1 },
  ],
  quizzes: [{ id: "q2", lesson_id: "l2" }],
};

const student = (id: string, program: string) => ({
  id,
  full_name: id.toUpperCase(),
  username: id,
  email: `${id}@x.id`,
  program,
  xp: 100,
  level: 2,
});

const sub = (student_id: string, content_id: string, type: string, score: number | null, at: string) => ({
  student_id,
  content_id,
  type,
  score,
  submitted_at: at,
});

describe("summarizeStudents", () => {
  it("maps quiz submissions to lessons, keeps the best score and counts program totals", () => {
    const [a, b] = summarizeStudents({
      ...catalog,
      now: NOW,
      students: [student("a", "supercoder"), student("b", "minas")],
      submissions: [
        sub("a", "l1", "code", 40, daysAgo(3)),
        sub("a", "l1", "code", 90, daysAgo(2)),
        sub("a", "q2", "quiz", 80, daysAgo(1)),
        sub("b", "l4", "web", 75, daysAgo(0, 2)),
      ],
    });

    // Supercoder: l1, l2, l3 (m2 tanpa programs = supercoder). MINAS: l1, l2, l4.
    expect(a.total).toBe(3);
    expect(a.done).toBe(2);
    expect(a.pct).toBe(67);
    expect(a.lastLesson).toEqual({ title: "Kuis Dasar", subject: "Python", source: "Kuis", score: 80 });
    expect(a.avg30).toBe(85);
    expect(b.total).toBe(3);
    expect(b.done).toBe(1);
    expect(b.attention).toBeNull();
  });

  it("scores the selected subject but keeps activity from all subjects", () => {
    const [b] = summarizeStudents({
      ...catalog,
      subjectId: "s1",
      now: NOW,
      students: [student("b", "minas")],
      submissions: [sub("b", "l4", "web", 75, daysAgo(1))],
    });
    expect(b.total).toBe(2);
    expect(b.done).toBe(0);
    expect(b.avg30).toBeNull();
    // Aktif di mapel lain tetap terhitung aktif, bukan "belum pernah mengerjakan".
    expect(b.lastActivityAt).toBe(daysAgo(1));
    expect(b.lastLesson?.subject).toBe("Web");
    expect(b.weekly[7]).toBe(1);
    expect(b.attention).toBeNull();
  });

  it("buckets activity into 8 rolling weeks, oldest first", () => {
    const [a] = summarizeStudents({
      ...catalog,
      now: NOW,
      students: [student("a", "supercoder")],
      submissions: [
        sub("a", "l1", "code", 90, daysAgo(0, 1)),
        sub("a", "l1", "code", 95, daysAgo(6)),
        sub("a", "l3", "code", 70, daysAgo(8)),
        sub("a", "l3", "code", 70, daysAgo(60)),
      ],
    });
    expect(a.weekly).toEqual([0, 0, 0, 0, 0, 0, 1, 2]);
    expect(a.passedThisWeek).toBe(1);
  });

  it("flags students who need attention", () => {
    const rows = summarizeStudents({
      ...catalog,
      now: NOW,
      students: [student("idle", "supercoder"), student("low", "supercoder"), student("new", "supercoder")],
      submissions: [
        sub("idle", "l1", "code", 90, daysAgo(9)),
        sub("low", "l1", "code", 50, daysAgo(1)),
      ],
    });
    expect(rows.map((r) => r.attention)).toEqual([
      "Tidak aktif 9 hari",
      "Rata-rata di bawah 70",
      "Belum pernah mengerjakan",
    ]);
  });
});

describe("buildStudentProfile", () => {
  const profile = buildStudentProfile({
    ...catalog,
    program: "supercoder",
    now: NOW,
    submissions: [
      sub("a", "l1", "code", 40, daysAgo(3)),
      { ...sub("a", "l1", "code", 90, daysAgo(2)), feedback: "Bagus" },
      sub("a", "l1", "lesson", 95, daysAgo(2, -1)),
      sub("a", "q2", "quiz", 60, daysAgo(1)),
      sub("a", "q2", "quiz", 65, daysAgo(0, 1)),
    ],
  });

  it("groups scores by source", () => {
    const bySource = Object.fromEntries(profile.sources.map((s) => [s.type, s]));
    expect(bySource.code).toMatchObject({ lessons: 1, avg: 90, passed: 1 });
    expect(bySource.lesson).toMatchObject({ lessons: 1, avg: 95, passed: 1 });
    expect(bySource.quiz).toMatchObject({ lessons: 1, avg: 65, passed: 0 });
    expect(bySource.project).toMatchObject({ lessons: 0, avg: null });
  });

  it("numbers attempts per lesson and source, newest first", () => {
    expect(profile.timeline.map((t) => [t.lesson, t.source, t.attempt])).toEqual([
      ["Kuis Dasar", "Kuis", 2],
      ["Kuis Dasar", "Kuis", 1],
      ["Print", "Nilai Guru", 1],
      ["Print", "Coding", 2],
      ["Print", "Coding", 1],
    ]);
    expect(profile.timeline[3].feedback).toBe("Bagus");
  });

  it("lists lessons to retry and progress per subject", () => {
    expect(profile.retry).toEqual([
      expect.objectContaining({ title: "Kuis Dasar", score: 65, attempts: 2 }),
    ]);
    expect(profile.total).toBe(3);
    expect(profile.done).toBe(1);
    expect(profile.subjects.map((s) => [s.title, s.done, s.total])).toEqual([["Python", 1, 3]]);
    expect(profile.attempts).toBe(5);
  });

  it("counts active WITA days and streaks this month", () => {
    // Aktif 28, 29, 30, dan 31 Okt (WITA): empat hari berturut-turut.
    expect(profile.activeDaysThisMonth).toBe(4);
    expect(profile.longestStreakThisMonth).toBe(4);
  });
});

describe("helpers", () => {
  it("formats relative time in Indonesian", () => {
    expect(relativeTime(null, NOW)).toBe("Belum pernah");
    expect(relativeTime(daysAgo(0, 2), NOW)).toBe("2 jam lalu");
    expect(relativeTime(daysAgo(1), NOW)).toBe("Kemarin");
    expect(relativeTime(daysAgo(9), NOW)).toBe("9 hari lalu");
  });

  it("colors scores consistently", () => {
    expect([scoreTone(70), scoreTone(69), scoreTone(49), scoreTone(null)]).toEqual([
      "good",
      "warn",
      "bad",
      "none",
    ]);
  });
});
