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
                  hubungi instruktur via WhatsApp.
                </p>
                <a
                  href={`https://wa.me/6287788931919?text=${encodeURIComponent(`Halo Instruktur Supercoder, saya ingin bertanya seputar materi: ${subject.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    backgroundColor: "#22C55E",
                    color: "#FFFFFF",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:bg-emerald-600 hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 fill-current shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>Tanya Instruktur</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
