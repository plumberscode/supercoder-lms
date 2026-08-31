import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import QuizView from "./quiz-view";
import ProjectSubmission from "./project-submission";
import CodeChallenge from "@/components/CodeChallenge";
import CssChallenge from "@/components/CssChallenge";

export default async function LessonPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, module_id(subject_id, title)")
    .eq("id", id)
    .single();

  if (!lesson) return <div>Materi tidak ditemukan</div>;

  let lessonScore = null;
  let codeSubmission = null;
  let cssSubmission: { score: number; data: any } | null = null;
  if (user) {
    const { data } = await supabase
      .from("submissions")
      .select("score, feedback, graded_at")
      .eq("student_id", user.id)
      .eq("content_id", id)
      .eq("type", "lesson")
      .maybeSingle();
    if (data) lessonScore = data;

    const { data: codeSub } = await supabase
      .from("submissions")
      .select("score, data")
      .eq("student_id", user.id)
      .eq("content_id", id)
      .eq("type", "code")
      .maybeSingle();
    if (codeSub) {
      codeSubmission = codeSub;
    }

    const { data: cssSub } = await supabase
      .from("submissions")
      .select("score, data")
      .eq("student_id", user.id)
      .eq("content_id", id)
      .eq("type", "css")
      .maybeSingle();
    if (cssSub) {
      cssSubmission = cssSub;
    }
  }

  // Fetch coding challenge if lesson type is 'code'
  let codingChallenge = null;
  let testCases: any[] = [];
  if (lesson.type === "code") {
    const { data: challenge } = await supabase
      .from("coding_challenges")
      .select("*")
      .eq("lesson_id", id)
      .single();
    if (challenge) {
      codingChallenge = challenge;
      const { data: cases } = await supabase
        .from("test_cases")
        .select("*")
        .eq("challenge_id", challenge.id)
        .order("order_index");
      testCases = cases || [];
    }
  }

  // Fetch CSS challenge if lesson type is 'css-challenge'
  let cssChallenge = null;
  if (lesson.type === "css-challenge") {
    const { data: challenge } = await supabase
      .from("css_challenges")
      .select("*")
      .eq("lesson_id", id)
      .single();
    if (challenge) cssChallenge = challenge;
  }

  const subjectId = (lesson.module_id as any).subject_id;
  const moduleTitle = (lesson.module_id as any).title;
  const isCodingLesson = lesson.type === "code" || lesson.type === "css-challenge";

  // ── Shared header content (used in both layouts) ──────────────────────
  const waHref = `https://wa.me/6287788931919?text=${encodeURIComponent(`Halo Instruktur Supercoder, saya ingin bertanya seputar materi: ${lesson.title}`)}`;

  const waButton = (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#22C55E",
        color: "#FFFFFF",
        padding: "6px 14px",
        borderRadius: "8px",
        fontSize: "0.825rem",
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: "0 2px 6px rgba(34, 197, 94, 0.2)",
        transition: "all 0.15s ease",
      }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "14px", height: "14px", flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span>Tanya Instruktur</span>
    </a>
  );

  // ── IDE layout for coding challenges ──────────────────────────────────
  if (isCodingLesson) {
    return (
      <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", backgroundColor: "#0f0f0f" }}>
        {/* Slim IDE header — 48px */}
        <header style={{
          height: "48px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid #2d2d2d",
        }}>
          <Link
            href={`/subjects/${subjectId}`}
            style={{ fontWeight: 600, color: "#94a3b8", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            ← {moduleTitle}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {waButton}
            <div style={{ fontWeight: 800, color: "#ef4444", fontSize: "0.9rem" }}>Supercoder</div>
          </div>
        </header>

        {/* IDE body — fills remaining viewport */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {lesson.type === "code" && codingChallenge && (
            <CodeChallenge
              challenge={codingChallenge}
              testCases={testCases}
              existingSubmission={codeSubmission}
            />
          )}
          {lesson.type === "code" && !codingChallenge && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>💻</span>
              <p>Soal coding untuk materi ini belum dibuat oleh guru.</p>
            </div>
          )}
          {lesson.type === "css-challenge" && cssChallenge && (
            <CssChallenge
              challenge={cssChallenge}
              existingSubmission={cssSubmission}
            />
          )}
          {lesson.type === "css-challenge" && !cssChallenge && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>🎨</span>
              <p>Soal CSS untuk materi ini belum dibuat oleh guru.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Standard layout for non-coding lesson types ───────────────────────
  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid var(--border)",
          padding: "16px 40px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href={`/subjects/${subjectId}`}
            style={{
              fontWeight: 600,
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← {moduleTitle}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {waButton}
            <div style={{ fontWeight: 800, color: "var(--primary)" }}>
              Supercoder
            </div>
          </div>
        </div>
      </header>

      <div
        className="container"
        style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto" }}
      >
        <h1
          style={{
            fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
            marginBottom: "32px",
          }}
        >
          {lesson.title}
        </h1>

        <div className="card" style={{ marginBottom: "40px" }}>
          {lessonScore && (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#166534",
                    margin: "0 0 8px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>🏆</span> Nilai Materi
                </h3>
                <p style={{ margin: 0, color: "#15803D", fontSize: "0.9rem" }}>
                  Dinilai pada{" "}
                  {new Date(lessonScore.graded_at).toLocaleDateString()}
                  {lessonScore.feedback && (
                    <span
                      style={{
                        display: "block",
                        marginTop: "8px",
                        fontStyle: "italic",
                        color: "#166534",
                      }}
                    >
                      &quot;{lessonScore.feedback}&quot;
                    </span>
                  )}
                </p>
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#166534",
                  backgroundColor: "white",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                {lessonScore.score}{" "}
                <span
                  style={{
                    fontSize: "1rem",
                    color: "#86EFAC",
                    fontWeight: 600,
                  }}
                >
                  / 100
                </span>
              </div>
            </div>
          )}

          {/* Material Viewer */}
          {lesson.type === "video" && (
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                borderRadius: "12px",
                backgroundColor: "black",
              }}
            >
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                src={lesson.content_url?.replace("watch?v=", "embed/")}
                title="Lesson Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {lesson.type === "pdf" && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <span
                style={{
                  fontSize: "4rem",
                  marginBottom: "16px",
                  display: "block",
                }}
              >
                📄
              </span>
              <h3>Materi Pembelajaran (PDF)</h3>
              <p style={{ color: "#64748B", marginBottom: "24px" }}>
                Silakan tinjau dokumen di bawah ini untuk melanjutkan.
              </p>
              <a
                href={lesson.content_url}
                target="_blank"
                className="btn btn-primary"
              >
                Buka PDF
              </a>
            </div>
          )}

          {lesson.type === "link" && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <span
                style={{
                  fontSize: "4rem",
                  marginBottom: "16px",
                  display: "block",
                }}
              >
                🔗
              </span>
              <h3>Sumber Eksternal</h3>
              <p style={{ color: "#64748B", marginBottom: "24px" }}>
                Ikuti link di bawah ini untuk mengakses materi pembelajaran.
              </p>
              <a
                href={lesson.content_url}
                target="_blank"
                className="btn btn-primary"
              >
                Buka Link
              </a>
            </div>
          )}

          {lesson.type === "text" && (
            <div style={{ padding: "20px", lineHeight: 1.8 }}>
              <p>{lesson.content_url || "Konten teks akan muncul di sini."}</p>
            </div>
          )}


          {lesson.type === "quiz" && <QuizView lessonId={lesson.id} />}
        </div>

        {lesson.is_project_required && <ProjectSubmission lessonId={lesson.id} />}
      </div>
    </div>
  );
}
