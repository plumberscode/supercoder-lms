import { describe, it, expect } from "vitest";
import { MAX_ATTEMPTS, attemptsSinceReset, buildAttemptQuota, totalAttempts } from "../attempts";

const a = (at: string) => ({ score: 50, feedback: "", at });

describe("attemptsSinceReset", () => {
  const list = [a("2026-11-01T10:00:00Z"), a("2026-11-02T10:00:00Z"), a("2026-11-03T10:00:00Z")];

  it("menghitung semua percobaan bila belum pernah direset", () => {
    expect(attemptsSinceReset(list, null)).toBe(3);
    expect(attemptsSinceReset(list, undefined)).toBe(3);
  });

  it("hanya menghitung percobaan setelah reset", () => {
    expect(attemptsSinceReset(list, "2026-11-03T12:00:00Z")).toBe(0);
    expect(attemptsSinceReset([...list, a("2026-11-04T10:00:00Z")], "2026-11-03T12:00:00Z")).toBe(1);
    expect(attemptsSinceReset(list, "2026-11-01T12:00:00Z")).toBe(2);
  });

  it("menganggap percobaan tanpa waktu terjadi sebelum reset", () => {
    expect(attemptsSinceReset([{ score: 1 }], "2026-11-01T00:00:00Z")).toBe(0);
    expect(attemptsSinceReset([{ score: 1 }], null)).toBe(1);
  });

  it("aman untuk data yang bukan array", () => {
    expect(attemptsSinceReset(null, null)).toBe(0);
    expect(totalAttempts({})).toBe(0);
  });
});

describe("buildAttemptQuota", () => {
  const lessons = [
    { id: "l1", title: "Kartu Profil" },
    { id: "l2", title: "Tombol Warna" },
    { id: "l3", title: "Soal Python" },
  ];
  const base = { attempts_reset_at: null, attempts_reset_count: 0 };

  it("menyaring kiriman tanpa riwayat dan mengurutkan yang habis dulu", () => {
    const rows = buildAttemptQuota(
      [
        { ...base, id: "s2", content_id: "l2", type: "css", attempts: [a("2026-11-01T00:00:00Z")] },
        {
          ...base,
          id: "s1",
          content_id: "l1",
          type: "web",
          attempts: [a("2026-11-01T00:00:00Z"), a("2026-11-02T00:00:00Z"), a("2026-11-03T00:00:00Z")],
        },
        { ...base, id: "s3", content_id: "l3", type: "code", attempts: null },
      ],
      lessons,
    );
    expect(rows.map((r) => r.submissionId)).toEqual(["s1", "s2"]);
    expect(rows[0]).toMatchObject({ lessonTitle: "Kartu Profil", source: "Web", used: MAX_ATTEMPTS, total: 3 });
  });

  it("memakai jatah setelah reset dan menyimpan jumlah reset", () => {
    const [row] = buildAttemptQuota(
      [
        {
          id: "s1",
          content_id: "l1",
          type: "code",
          attempts: [a("2026-11-01T00:00:00Z"), a("2026-11-02T00:00:00Z"), a("2026-11-03T00:00:00Z")],
          attempts_reset_at: "2026-11-02T12:00:00Z",
          attempts_reset_count: 2,
        },
      ],
      lessons,
    );
    expect(row).toMatchObject({ source: "HTML+JS", used: 1, total: 3, resetCount: 2 });
  });
});
