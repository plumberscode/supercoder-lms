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

// Nilai minimal agar materi dianggap lulus (sama dengan pemberian XP di server action).
export const PASSING_SCORE = 70;

// Teaser mengerjakan materi secara berurutan; siswa lain dan staf bebas memilih materi.
export function followsLessonSequence(viewer: Viewer) {
  return !isStaff(viewer.role) && viewer.program === "teaser";
}

const GRADED_LESSON_TYPES = new Set(["quiz", "code", "css-challenge", "web-challenge"]);

export type SequenceLesson = {
  id: string;
  type: string;
  is_project_required?: boolean | null;
};

// Materi bernilai harus lulus dulu; materi bacaan (video/teks/PDF/link tanpa proyek)
// tidak punya nilai, jadi tidak menahan materi sesudahnya.
export function isGradedLesson(lesson: SequenceLesson) {
  return GRADED_LESSON_TYPES.has(lesson.type) || !!lesson.is_project_required;
}

// Materi yang masih terkunci: semua materi setelah materi bernilai pertama yang belum
// lulus. `lessons` harus sudah urut (modul lalu materi); bestScore null = menunggu dinilai.
export function lockedBySequence(
  lessons: SequenceLesson[],
  bestScore: Map<string, number | null>,
) {
  const locked = new Set<string>();
  let blocked = false;
  for (const lesson of lessons) {
    if (blocked) {
      locked.add(lesson.id);
      continue;
    }
    const score = bestScore.get(lesson.id);
    if (isGradedLesson(lesson) && (score == null || score < PASSING_SCORE)) {
      blocked = true;
    }
  }
  return locked;
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
