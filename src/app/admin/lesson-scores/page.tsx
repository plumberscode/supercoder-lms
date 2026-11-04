import { createClient } from "@/utils/supabase/server";
import { fetchAllRows, fetchCatalog } from "@/lib/gradebook-data";
import LessonScoreBoard, { type LessonScore } from "./LessonScoreBoard";

export default async function LessonScoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject_id?: string;
    lesson_id?: string;
    program?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Teaser tidak dinilai; halaman ini hanya untuk siswa Supercoder dan MINAS yang aktif.
  const [catalog, studentsRes, scores] = await Promise.all([
    fetchCatalog(supabase),
    supabase
      .from("profiles")
      .select("id, full_name, username, email, program")
      .eq("role", "student")
      .neq("status", "inactive")
      .neq("program", "teaser")
      .order("full_name"),
    fetchAllRows<LessonScore>((from, to) =>
      supabase
        .from("submissions")
        .select("id, student_id, content_id, score, feedback, graded_at, data")
        .eq("type", "lesson")
        .order("id")
        .range(from, to),
    ),
  ]);
  if (studentsRes.error) throw new Error(studentsRes.error.message);

  return (
    <LessonScoreBoard
      subjects={catalog.subjects}
      modules={catalog.modules}
      lessons={catalog.lessons}
      students={studentsRes.data ?? []}
      scores={scores}
      initial={{
        subjectId: params.subject_id ?? "",
        lessonId: params.lesson_id ?? "",
        program: params.program ?? "",
      }}
    />
  );
}
