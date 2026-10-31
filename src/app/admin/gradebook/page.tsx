import { createClient } from "@/utils/supabase/server";
import { fetchCatalog, fetchSubmissions } from "@/lib/gradebook-data";
import { summarizeStudents } from "@/lib/gradebook";
import StudentTable from "./StudentTable";

export default async function GradebookPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject_id?: string;
    program?: string;
    q?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Teaser tidak dinilai; Buku Nilai hanya untuk siswa Supercoder dan MINAS yang aktif.
  const [catalog, submissions, studentsRes] = await Promise.all([
    fetchCatalog(supabase),
    fetchSubmissions(supabase),
    supabase
      .from("profiles")
      .select("id, full_name, username, email, program, xp, level")
      .eq("role", "student")
      .neq("status", "inactive")
      .neq("program", "teaser")
      .order("full_name"),
  ]);
  if (studentsRes.error) throw new Error(studentsRes.error.message);

  const subjectId = catalog.subjects.some((s) => s.id === params.subject_id)
    ? params.subject_id
    : undefined;
  const now = new Date();
  const rows = summarizeStudents({
    ...catalog,
    subjectId,
    students: studentsRes.data ?? [],
    submissions,
    now,
  });

  return (
    <StudentTable
      rows={rows}
      subjects={catalog.subjects}
      subjectId={subjectId ?? ""}
      now={now.toISOString()}
      initial={{
        q: params.q ?? "",
        program: params.program ?? "",
        status: params.status ?? "all",
        sort: params.sort ?? "",
      }}
    />
  );
}
