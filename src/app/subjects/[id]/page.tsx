import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import styles from "./subject.module.css";

export default async function SubjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select(
      `
      *,
      modules (
        *,
        lessons (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!subject)
    return (
      <div className="container" style={{ padding: "40px" }}>
        Mata Pelajaran tidak ditemukan
      </div>
    );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userScores: Record<string, number> = {};

  if (user && subject.modules) {
    const lessonIds = subject.modules.flatMap(
      (m: any) => m.lessons?.map((l: any) => l.id) || [],
    );

    if (lessonIds.length > 0) {
      const { data: submissions } = await supabase
        .from("submissions")
        .select("content_id, score")
        .eq("student_id", user.id)
        .in("content_id", lessonIds);

      if (submissions) {
        submissions.forEach((sub) => {
          if (sub.score !== null) {
            userScores[sub.content_id] = Math.max(
              userScores[sub.content_id] || 0,
              sub.score,
            );
          }
        });
      }
    }
  }

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid var(--border)",
          padding: "20px 40px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 0,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontWeight: 600,
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Kembali ke Dashboard
          </Link>
          <div style={{ fontWeight: 800, color: "var(--primary)" }}>
            Supercoder
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "48px 24px" }}>
        <div style={{ marginBottom: "48px" }}>
          <div className="badge badge-xp" style={{ marginBottom: "16px" }}>
            KURSUS
          </div>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              color: "var(--secondary)",
              lineHeight: 1.1,
            }}
          >
            {subject.title}
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "#64748B",
              marginTop: "16px",
              maxWidth: "700px",
            }}
          >
            {subject.description}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 350px",
            gap: "40px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {subject.modules
              ?.sort((a: any, b: any) => a.order_index - b.order_index)
              .map((module: any) => (
                <div key={module.id}>
                  <h3
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "var(--secondary)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.875rem",
                      }}
                    >
                      {module.order_index}
                    </span>
                    {module.title}
                  </h3>
                  <div
                    className="card"
                    style={{
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {module.lessons
                      ?.sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((lesson: any) => (
                        <Link
                          href={`/lessons/${lesson.id}`}
                          key={lesson.id}
                          className={styles.lessonItem}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                            }}
                          >
                            <span style={{ fontSize: "1.25rem" }}>
                              {lesson.type === "video"
                                ? "📺"
                                : lesson.type === "quiz"
                                  ? "🧠"
                                  : "📄"}
                            </span>
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {lesson.title}
                                {userScores[lesson.id] >= 70 && (
                                  <span
                                    style={{
                                      color: "#10B981",
                                      fontSize: "1rem",
                                    }}
                                    title={`Selesai (Skor: ${userScores[lesson.id]})`}
                                  >
                                    ✅
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#94A3B8",
                                }}
                              >
                                {lesson.type.toUpperCase()}{" "}
                                {lesson.description &&
                                  `• ${lesson.description}`}
                              </div>
                            </div>
                          </div>
                          <div className={styles.playIcon}>MULAI ▶</div>
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
          </div>

          <aside>
            <div className="card" style={{ position: "sticky", top: "100px" }}>
              <h3 style={{ marginBottom: "16px" }}>Progres Anda</h3>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#F1F5F9",
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "0%",
                    height: "100%",
                    backgroundColor: "var(--success)",
                  }}
                ></div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#64748B" }}>
                Selesaikan semua materi untuk mendapatkan lencana penyelesaian!
              </p>

              <div
                style={{
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Butuh Bantuan?
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748B",
                    marginBottom: "16px",
                  }}
                >
                  Jika Anda memiliki pertanyaan tentang materi ini, silakan
                  hubungi instruktur.
                </p>
                <button className="btn btn-secondary" style={{ width: "100%" }}>
                  Tanya Instruktur
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
