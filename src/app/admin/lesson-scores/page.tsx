import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import Link from "next/link";
import ProgramFilter, { parseProgramFilter, programQuery } from "../ProgramFilter";
import { saveLessonXpReward, submitLessonScore } from "./actions";

export default async function LessonScoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject_id?: string;
    module_id?: string;
    lesson_id?: string;
    program?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  // Teaser tidak dinilai; filter ini memisahkan siswa Supercoder dan MINAS.
  const program = parseProgramFilter(params.program, ["supercoder", "minas"]);

  // Fetch all active subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, title")
    .order("order_index");

  let modules: any[] = [];
  let lessons: any[] = [];
  let students: any[] = [];
  const scoresMap: Record<string, any> = {};
  let xpReward = 0;

  if (params.subject_id) {
    const { data } = await supabase
      .from("modules")
      .select("*")
      .eq("subject_id", params.subject_id)
      .order("order_index");
    // Bila satu program dipilih, hanya modul yang dicentang untuk program itu.
    modules = (data || []).filter(
      (m) => !program || (m.programs ?? ["supercoder"]).includes(program),
    );
  }

  if (params.module_id) {
    const { data } = await supabase
      .from("lessons")
      .select("id, title")
      .eq("module_id", params.module_id)
      .order("order_index");
    lessons = data || [];
  }

  if (params.lesson_id) {
    // Kolom xp_reward baru ada setelah migration_lesson_xp_reward.sql; tanpa itu tetap 0.
    const { data: lessonRow } = await supabase
      .from("lessons")
      .select("xp_reward")
      .eq("id", params.lesson_id)
      .maybeSingle();
    xpReward = lessonRow?.xp_reward ?? 0;

    // Fetch all students
    let studentQuery = supabase
      .from("profiles")
      .select("id, full_name, email, username")
      .eq("role", "student")
      .neq("status", "inactive")
      .neq("program", "teaser");
    if (program) studentQuery = studentQuery.eq("program", program);
    const { data: allStudents } = await studentQuery.order("full_name");
    students = allStudents || [];

    // Fetch existing scores for this lesson
    const { data: existingScores } = await supabase
      .from("submissions")
      .select("*")
      .eq("content_id", params.lesson_id)
      .eq("type", "lesson");

    if (existingScores) {
      existingScores.forEach((score) => {
        scoresMap[score.student_id] = score;
      });
    }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>💯 Penilaian Materi (Offline/Manual)</h1>

      <ProgramFilter
        basePath="/admin/lesson-scores"
        params={params}
        current={program}
        allowed={["supercoder", "minas"]}
      />
      <p style={{ marginBottom: "24px", color: "var(--text-muted)" }}>
        Pilih mata pelajaran, modul, dan materi untuk memberikan nilai secara
        manual kepada siswa.
      </p>

      <div
        className="card"
        style={{
          marginBottom: "32px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Mata Pelajaran
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {subjects?.map((sub) => (
              <Link
                key={sub.id}
                href={`/admin/lesson-scores?subject_id=${sub.id}${programQuery(program)}`}
                className={`btn ${params.subject_id === sub.id ? "btn-primary" : ""}`}
                style={{
                  textAlign: "left",
                  backgroundColor:
                    params.subject_id !== sub.id ? "#F1F5F9" : undefined,
                  color: params.subject_id !== sub.id ? "#334155" : undefined,
                }}
              >
                {sub.title}
              </Link>
            ))}
          </div>
        </div>

        {params.subject_id && (
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Modul
            </label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {modules?.map((mod) => (
                <Link
                  key={mod.id}
                  href={`/admin/lesson-scores?subject_id=${params.subject_id}&module_id=${mod.id}${programQuery(program)}`}
                  className={`btn ${params.module_id === mod.id ? "btn-primary" : ""}`}
                  style={{
                    textAlign: "left",
                    backgroundColor:
                      params.module_id !== mod.id ? "#F1F5F9" : undefined,
                    color: params.module_id !== mod.id ? "#334155" : undefined,
                  }}
                >
                  {mod.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {params.module_id && (
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Materi
            </label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {lessons?.map((les) => (
                <Link
                  key={les.id}
                  href={`/admin/lesson-scores?subject_id=${params.subject_id}&module_id=${params.module_id}&lesson_id=${les.id}${programQuery(program)}`}
                  className={`btn ${params.lesson_id === les.id ? "btn-primary" : ""}`}
                  style={{
                    textAlign: "left",
                    backgroundColor:
                      params.lesson_id !== les.id ? "#F1F5F9" : undefined,
                    color: params.lesson_id !== les.id ? "#334155" : undefined,
                  }}
                >
                  {les.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {params.lesson_id && (
        <div className="card">
          <form
            action={saveLessonXpReward}
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              padding: "16px",
              marginBottom: "24px",
              borderRadius: "12px",
              backgroundColor: "#F8FAFC",
              border: "1px solid var(--border)",
            }}
          >
            <input type="hidden" name="lessonId" value={params.lesson_id} />
            <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              ⚡ Bobot XP materi ini
            </label>
            <div className={styles.inputGroup} style={{ width: "100px" }}>
              <input
                type="number"
                name="xpReward"
                min="0"
                defaultValue={xpReward}
                required
              />
            </div>
            <button type="submit" className="btn">
              Simpan Bobot
            </button>
            <p
              style={{
                flexBasis: "100%",
                margin: 0,
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              Nilai siswa diisi dengan skala 0–100. Siswa mendapat XP ini sekali,
              saat nilainya pertama kali mencapai 70 atau lebih.
            </p>
          </form>

          <h2 style={{ marginBottom: "24px" }}>Daftar Siswa</h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {students.map((student) => {
              const existingScore = scoresMap[student.id];
              return (
                <div
                  key={student.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <h3 style={{ margin: 0 }}>
                      {student.full_name || "Tanpa Nama"}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "0.875rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {student.username ?? student.email}
                    </p>
                    {existingScore && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#DCFCE7",
                          color: "#166534",
                          marginTop: "8px",
                          display: "inline-block",
                        }}
                      >
                        Dinilai pada{" "}
                        {new Date(existingScore.graded_at).toLocaleDateString()}
                        {existingScore.data?.xp_awarded
                          ? ` · +${existingScore.data.xp_awarded} XP`
                          : ""}
                      </span>
                    )}
                  </div>

                  <form
                    action={submitLessonScore}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="hidden"
                      name="lessonId"
                      value={params.lesson_id}
                    />
                    <input type="hidden" name="studentId" value={student.id} />

                    <div
                      className={styles.inputGroup}
                      style={{ width: "100px" }}
                    >
                      <input
                        type="number"
                        name="score"
                        placeholder="Nilai 0–100"
                        aria-label="Nilai (0–100)"
                        min="0"
                        max="100"
                        defaultValue={existingScore?.score || ""}
                        required
                      />
                    </div>

                    <div
                      className={styles.inputGroup}
                      style={{ width: "250px" }}
                    >
                      <input
                        type="text"
                        name="feedback"
                        placeholder="Komentar (Opsional)"
                        defaultValue={existingScore?.feedback || ""}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: "0.75rem 1.5rem" }}
                    >
                      Simpan
                    </button>
                  </form>
                </div>
              );
            })}

            {students.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "var(--text-muted)",
                }}
              >
                Belum ada siswa yang terdaftar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
