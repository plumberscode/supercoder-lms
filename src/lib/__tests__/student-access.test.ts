import { describe, it, expect } from "vitest";
import { blockedStudentPath, canAccessModule } from "@/lib/student-access";

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
