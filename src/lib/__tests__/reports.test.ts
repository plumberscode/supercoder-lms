import { describe, it, expect } from "vitest";
import {
  buildNoteHints,
  formatPeriod,
  shiftPeriod,
  normalizePeriod,
  periodRange,
  previousPeriod,
  summarizeSubmissions,
} from "@/lib/reports";
import { buildWaLink, normalizeWaNumber } from "@/lib/whatsapp";

describe("period helpers", () => {
  it("normalizes YYYY-MM and rejects junk", () => {
    expect(normalizePeriod("2026-09")).toBe("2026-09-01");
    expect(normalizePeriod("2026-09-15")).toBe("2026-09-01");
    expect(normalizePeriod("2026-13")).toBeNull();
    expect(normalizePeriod(undefined)).toBeNull();
  });

  it("uses WITA (UTC+8) month boundaries", () => {
    expect(periodRange("2026-09-01")).toEqual({
      start: "2026-08-31T16:00:00.000Z",
      end: "2026-09-30T16:00:00.000Z",
    });
    expect(periodRange("2026-12-01").end).toBe("2026-12-31T16:00:00.000Z");
  });

  it("picks the previous month in WITA", () => {
    // 1 Okt 01:00 WITA masih 30 Sep di UTC, tapi bulan lalu tetap September.
    expect(previousPeriod(new Date("2026-09-30T17:00:00Z"))).toBe("2026-09-01");
    expect(previousPeriod(new Date("2026-01-10T00:00:00Z"))).toBe("2025-12-01");
  });

  it("formats period in Indonesian", () => {
    expect(formatPeriod("2026-09-01")).toBe("September 2026");
  });
});

describe("summarizeSubmissions", () => {
  const base = {
    period: "2026-09-01",
    subjects: [
      { id: "s1", title: "Web Dasar" },
      { id: "s2", title: "Python" },
    ],
    modules: [
      { id: "m1", subject_id: "s1" },
      { id: "m2", subject_id: "s2" },
    ],
    lessons: [
      { id: "l1", module_id: "m1", title: "HTML" },
      { id: "l2", module_id: "m1", title: "CSS" },
      { id: "l3", module_id: "m1", title: "JS" },
      { id: "l4", module_id: "m1", title: "Kuis Web" },
      { id: "p1", module_id: "m2", title: "Print" },
    ],
    quizzes: [{ id: "q1", lesson_id: "l4" }],
  };

  const sub = (
    content_id: string,
    type: string,
    score: number | null,
    submitted_at: string,
    feedback: string | null = null,
  ) => ({ content_id, type, score, submitted_at, feedback });

  it("counts overall progress up to period end and monthly activity only inside the period", () => {
    const result = summarizeSubmissions({
      ...base,
      submissions: [
        sub("l1", "code", 90, "2026-08-10T02:00:00Z"), // bulan lalu: progres saja
        sub("l2", "css", 60, "2026-09-05T02:00:00Z"),
        sub("l2", "css", 80, "2026-09-06T02:00:00Z", "Rapi!"),
        sub("q1", "quiz", 100, "2026-09-07T02:00:00Z"), // quiz.id -> l4
        sub("l3", "code", 95, "2026-10-01T02:00:00Z"), // setelah periode: diabaikan
      ],
    });

    expect(result.subjects).toEqual([
      {
        title: "Web Dasar",
        completed: 3,
        total: 4,
        progressPct: 75,
        monthAverage: 90,
        monthCount: 2,
        completedBefore: 1,
        monthXp: 0,
      },
    ]);
    expect(result.completedThisMonth).toBe(2);
    expect(result.activities.map((a) => [a.lesson, a.score, a.feedback])).toEqual([
      ["CSS", 80, "Rapi!"],
      ["Kuis Web", 100, null],
    ]);
    expect(result.totals).toEqual({ monthCount: 2, monthAverage: 90, completed: 3, total: 4 });
  });

  it("keeps ungraded projects as pending and excludes them from averages", () => {
    const result = summarizeSubmissions({
      ...base,
      submissions: [sub("p1", "project", null, "2026-09-20T02:00:00Z")],
    });
    expect(result.activities[0]).toMatchObject({ lesson: "Print", score: null });
    expect(result.totals.monthAverage).toBeNull();
    expect(result.subjects[0]).toMatchObject({ title: "Python", completed: 0, total: 1 });
  });

  it("treats teacher scores on lessons without an XP weight as XP, not low grades", () => {
    const result = summarizeSubmissions({
      ...base,
      lessons: [...base.lessons.slice(0, 2), { ...base.lessons[2], xp_reward: 40 }, ...base.lessons.slice(3)],
      submissions: [
        // HTML tanpa bobot XP: 20 = XP penuh (mis. "Figma Recipe Page (20 XP)").
        sub("l1", "lesson", 20, "2026-09-10T02:00:00Z"),
        // JS punya bobot XP, jadi skala 0–100: 60 belum selesai.
        sub("l3", "lesson", 60, "2026-09-11T02:00:00Z"),
      ],
    });
    expect(result.activities.map((a) => [a.lesson, a.score, a.xp])).toEqual([
      ["HTML", null, 20],
      ["JS", 60, null],
    ]);
    expect(result.subjects[0]).toMatchObject({ completed: 1, monthAverage: 60 });
    expect(result.totals.monthAverage).toBe(60);
  });

  it("summarizes sources, active days and the previous month", () => {
    const result = summarizeSubmissions({
      ...base,
      submissions: [
        sub("l1", "code", 60, "2026-08-10T02:00:00Z"), // Agustus: rata-rata bulan lalu
        sub("l2", "css", 80, "2026-08-20T02:00:00Z"),
        sub("l1", "code", 75, "2026-09-02T02:00:00Z"),
        sub("l1", "code", 95, "2026-09-03T02:00:00Z"),
        sub("l2", "lesson", 20, "2026-09-04T02:00:00Z"), // XP
        sub("q1", "quiz", 50, "2026-09-10T02:00:00Z"),
        sub("p1", "project", null, "2026-09-10T03:00:00Z"),
      ],
    });
    expect(result.sources).toEqual([
      { type: "quiz", label: "Kuis", lessons: 1, avg: 50, passed: 0, xp: 0, pending: 0 },
      { type: "code", label: "Tantangan Kode", lessons: 1, avg: 95, passed: 1, xp: 0, pending: 0 },
      { type: "lesson", label: "Nilai Guru", lessons: 1, avg: null, passed: 1, xp: 20, pending: 0 },
      { type: "project", label: "Proyek", lessons: 1, avg: null, passed: 0, xp: 0, pending: 1 },
    ]);
    // 2, 3, 4, dan 10 Sep: empat hari aktif, terpanjang tiga hari berturut-turut.
    expect(result.activeDays).toBe(4);
    expect(result.longestStreak).toBe(3);
    // l2 sudah lulus di Agustus (CSS 80), jadi yang baru selesai bulan ini hanya l1.
    expect(result.completedThisMonth).toBe(1);
    expect(result.previous).toEqual({ monthCount: 2, monthAverage: 70 });
  });

  it("treats submissions just after midnight WITA on the 1st as the new month", () => {
    const result = summarizeSubmissions({
      ...base,
      // 1 Okt 00:30 WITA = 30 Sep 16:30 UTC
      submissions: [sub("l1", "code", 90, "2026-09-30T16:30:00Z")],
    });
    expect(result.activities).toHaveLength(0);
  });
});

describe("buildNoteHints", () => {
  const snapshot = (over: Record<string, unknown> = {}) => ({
    period: "2026-09-01",
    student: { name: "Raka Pratama", xp: 0, level: 1 },
    totals: { monthCount: 3, monthAverage: 88, completed: 10, total: 20 },
    subjects: [{ title: "Web", completed: 8, total: 10, progressPct: 80, monthAverage: 90, monthCount: 2, completedBefore: 4 }],
    activities: [
      { date: "2026-09-02T02:00:00Z", subject: "Python", lesson: "Kuis Loop", type: "quiz", score: 65, feedback: null },
      { date: "2026-09-05T02:00:00Z", subject: "Desain", lesson: "Figma Recipe", type: "lesson", score: null, xp: 20, feedback: null },
    ],
    achievements: [],
    sources: [{ type: "web", label: "Tantangan Web", lessons: 2, avg: 97, passed: 2, xp: 0, pending: 0 }],
    activeDays: 12,
    completedThisMonth: 4,
    previous: { monthCount: 5, monthAverage: 84 },
    ...over,
  });

  it("suggests sentences from the month's data", () => {
    const hints = buildNoteHints(snapshot());
    expect(hints.map((h) => [h.field, h.label])).toEqual([
      ["month_note", "Aktif 12 hari bulan ini"],
      ["strengths", "Paling kuat: Tantangan Web (97)"],
      ["strengths", "Rata-rata naik 4 poin"],
      ["strengths", "4 materi Web selesai"],
      ["improvements", "Perlu diulang: Kuis Loop (65)"],
      ["parent_advice", "Ajak cerita: Figma Recipe"],
      ["parent_advice", "Latihan di rumah: Kuis Loop"],
    ]);
    expect(hints[0].text).toBe("Bulan ini Raka aktif belajar selama 12 hari dan menyelesaikan 4 materi.");
  });

  it("asks for a reason when there is no LMS activity", () => {
    const hints = buildNoteHints(snapshot({ activities: [], sources: [], previous: undefined }));
    expect(hints[0]).toMatchObject({ field: "month_note", label: "Tidak ada tugas LMS bulan ini" });
  });

  it("shifts periods across years", () => {
    expect(shiftPeriod("2026-01-01", -1)).toBe("2025-12-01");
  });
});

describe("whatsapp helpers", () => {
  it("normalizes Indonesian numbers", () => {
    expect(normalizeWaNumber("0812-3456-789")).toBe("628123456789");
    expect(normalizeWaNumber("+62 812 3456 789")).toBe("628123456789");
    expect(normalizeWaNumber("812345678")).toBe("62812345678");
    expect(normalizeWaNumber(null)).toBe("");
  });

  it("builds an encoded wa.me link", () => {
    expect(buildWaLink("0812", "Halo & salam")).toBe(
      "https://wa.me/62812?text=Halo%20%26%20salam",
    );
  });
});
