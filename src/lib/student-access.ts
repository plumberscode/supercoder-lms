// Halaman tujuan bagi siswa yang belum/tidak boleh mengakses materi.
export function blockedStudentPath(status: string | null | undefined) {
  return status === "inactive" ? "/akun-nonaktif" : "/pending-approval";
}

export type Program = "supercoder" | "minas" | "teaser";

export const PROGRAMS: { value: Program; label: string }[] = [
  { value: "supercoder", label: "Supercoder" },
  { value: "minas", label: "MINAS" },
  { value: "teaser", label: "Teaser" },
];

export type Viewer = {
  role: string | null;
  status: string | null;
  program?: string | null;
};

export function isStaff(role: string | null | undefined) {
  return role === "admin" || role === "teacher";
}

// Sebelum migration_program_access.sql dijalankan, kolom program/programs belum ada;
// saat itu semua siswa dan modul adalah Supercoder.
const DEFAULT_PROGRAM: Program = "supercoder";

// Admin/guru melihat semua modul; siswa hanya modul yang dicentang untuk program-nya.
// Sama dengan fungsi SQL can_access_lesson (migration_program_access.sql).
export function canAccessModule(
  viewer: Viewer,
  modulePrograms: string[] | null | undefined,
) {
  if (isStaff(viewer.role)) return true;
  if (viewer.status !== "approved") return false;
  const program = viewer.program ?? DEFAULT_PROGRAM;
  return (modulePrograms ?? [DEFAULT_PROGRAM]).includes(program);
}

export type ModuleVisibility = "open" | "locked" | "hidden";

// open: bisa dikerjakan. locked: teaser melihat judulnya sebagai ajakan ke kelas Supercoder.
// Modul khusus MINAS tidak pernah ditampilkan ke teaser.
export function moduleVisibility(
  viewer: Viewer,
  modulePrograms: string[] | null | undefined,
): ModuleVisibility {
  if (canAccessModule(viewer, modulePrograms)) return "open";
  if (
    viewer.status === "approved" &&
    viewer.program === "teaser" &&
    (modulePrograms ?? [DEFAULT_PROGRAM]).includes("supercoder")
  ) {
    return "locked";
  }
  return "hidden";
}
