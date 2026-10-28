import { describe, it, expect } from "vitest";
import {
  blockedStudentPath,
  canAccessModule,
  followsLessonSequence,
  lockedBySequence,
  moduleVisibility,
} from "@/lib/student-access";

const student = (program: string | null | undefined, status = "approved") => ({
  role: "student",
  status,
  program,
});

describe("canAccessModule", () => {
  it("allows a student into modules checked for their program", () => {
    expect(canAccessModule(student("minas"), ["supercoder", "minas"])).toBe(true);
    expect(canAccessModule(student("teaser"), ["teaser"])).toBe(true);
  });

  it("blocks a student from modules of other programs", () => {
    expect(canAccessModule(student("teaser"), ["supercoder"])).toBe(false);
    expect(canAccessModule(student("minas"), ["supercoder", "teaser"])).toBe(false);
    expect(canAccessModule(student("supercoder"), [])).toBe(false);
  });

  it("blocks students who are not approved", () => {
    expect(canAccessModule(student("supercoder", "pending"), ["supercoder"])).toBe(false);
    expect(canAccessModule(student("supercoder", "inactive"), ["supercoder"])).toBe(false);
  });

  it("lets admins and teachers see every module", () => {
    expect(canAccessModule({ role: "admin", status: "pending" }, [])).toBe(true);
    expect(canAccessModule({ role: "teacher", status: null, program: "teaser" }, ["minas"])).toBe(true);
  });

  it("treats missing columns (before the migration) as Supercoder", () => {
    expect(canAccessModule(student(undefined), undefined)).toBe(true);
    expect(canAccessModule(student(null), ["supercoder"])).toBe(true);
    expect(canAccessModule(student("teaser"), null)).toBe(false);
  });
});

describe("blockedStudentPath", () => {
  it("sends inactive students to the inactive page, others to pending", () => {
    expect(blockedStudentPath("inactive")).toBe("/akun-nonaktif");
    expect(blockedStudentPath("pending")).toBe("/pending-approval");
    expect(blockedStudentPath(undefined)).toBe("/pending-approval");
  });
});

describe("moduleVisibility", () => {
  it("opens modules the viewer can access", () => {
    expect(moduleVisibility(student("teaser"), ["supercoder", "teaser"])).toBe("open");
    expect(moduleVisibility(student("supercoder"), ["supercoder"])).toBe("open");
  });

  it("shows Supercoder modules to teasers as locked", () => {
    expect(moduleVisibility(student("teaser"), ["supercoder"])).toBe("locked");
    expect(moduleVisibility(student("teaser"), ["supercoder", "minas"])).toBe("locked");
  });

  it("hides MINAS-only modules from teasers", () => {
    expect(moduleVisibility(student("teaser"), ["minas"])).toBe("hidden");
    expect(moduleVisibility(student("teaser"), [])).toBe("hidden");
  });

  it("never shows locked modules to MINAS, Supercoder or inactive students", () => {
    expect(moduleVisibility(student("minas"), ["supercoder"])).toBe("hidden");
    expect(moduleVisibility(student("supercoder"), ["teaser"])).toBe("hidden");
    expect(moduleVisibility(student("teaser", "inactive"), ["supercoder"])).toBe("hidden");
  });
});

describe("followsLessonSequence", () => {
  it("applies only to teaser students", () => {
    expect(followsLessonSequence(student("teaser"))).toBe(true);
    expect(followsLessonSequence(student("supercoder"))).toBe(false);
    expect(followsLessonSequence(student("minas"))).toBe(false);
    expect(followsLessonSequence({ role: "admin", status: "approved", program: "teaser" })).toBe(false);
  });
});

describe("lockedBySequence", () => {
  const lessons = [
    { id: "video", type: "video" },
    { id: "quiz1", type: "quiz" },
    { id: "text", type: "text" },
    { id: "code", type: "code" },
    { id: "quiz2", type: "quiz" },
  ];
  const locked = (scores: [string, number | null][]) =>
    [...lockedBySequence(lessons, new Map(scores))];

  it("opens everything up to the first graded lesson not yet passed", () => {
    expect(locked([])).toEqual(["text", "code", "quiz2"]);
  });

  it("opens the next lessons once a graded lesson is passed", () => {
    expect(locked([["quiz1", 70]])).toEqual(["quiz2"]);
    expect(locked([["quiz1", 100], ["code", 85]])).toEqual([]);
  });

  it("keeps later lessons locked for failed or ungraded submissions", () => {
    expect(locked([["quiz1", 69]])).toEqual(["text", "code", "quiz2"]);
    expect(locked([["quiz1", null]])).toEqual(["text", "code", "quiz2"]);
  });

  it("treats reading lessons with a required project as graded", () => {
    const withProject = [
      { id: "a", type: "text", is_project_required: true },
      { id: "b", type: "video" },
    ];
    expect([...lockedBySequence(withProject, new Map())]).toEqual(["b"]);
  });
});
