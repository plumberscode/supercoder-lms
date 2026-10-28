import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  blockedStudentPath,
  canAccessModule,
  isStaff,
} from "@/lib/student-access";
import Link from "next/link";
import Image from "next/image";
import QuizView from "./quiz-view";
import ProjectSubmission from "./project-submission";
import CodeChallenge from "@/components/CodeChallenge";
import CssChallenge from "@/components/CssChallenge";
import WebChallenge from "@/components/WebChallenge";
import { prepareChallengeDescription } from "@/lib/challenge-description";
import ChallengeDescription from "@/components/ChallengeDescription";
import styles from "./lesson.module.css";
import StudentTopBar from "@/components/student/StudentTopBar";
import WhatsAppButton from "@/components/student/WhatsAppButton";
import { lessonTypeTheme } from "@/components/student/themes";
import ui from "@/components/student/student.module.css";
import { createAdminClient } from "@/utils/supabase/admin";
import { isLockedBySequence } from "@/lib/lesson-access";

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

  if (!user) redirect("/login");

  const { data: viewer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!viewer) redirect("/login");
  if (!isStaff(viewer.role) && viewer.status !== "approved") {
    redirect(blockedStudentPath(viewer.status));
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, module_id(*)")
    .eq("id", id)
    .single();

  if (!lesson) {
    return (
      <div className={ui.shell}>
        <StudentTopBar profile={viewer} email={user.email} />
        <main className={`${ui.page} ${ui.pageNarrow}`}>
          <div className={ui.emptyState}>
            <span className={ui.emptyEmoji}>🔍</span>
            <p>Materi tidak ditemukan.</p>
            <div className={ui.heroActions} style={{ justifyContent: "center" }}>
              <Link href="/dashboard" className={ui.secondaryBtn}>
                ← Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Materi dari modul program lain: kembali ke halaman subject-nya.
  // Teaser yang belum lulus materi sebelumnya juga dikembalikan ke sana.
  if (
    !canAccessModule(viewer, (lesson.module_id as any).programs) ||
    (await isLockedBySequence(
      supabase,
      viewer,
      user.id,
      (lesson.module_id as any).subject_id,
      lesson.id,
    ))
  ) {
    redirect(`/subjects/${(lesson.module_id as any).subject_id}`);
  }

  let lessonScore = null;
  let codeSubmission = null;
  let cssSubmission: { score: number; data: any } | null = null;
  let webSubmission: { score: number; data: any } | null = null;
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

    const { data: webSub } = await supabase
      .from("submissions")
      .select("score, data")
      .eq("student_id", user.id)
      .eq("content_id", id)
      .eq("type", "web")
      .maybeSingle();
    if (webSub) {
      webSubmission = webSub;
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
      codingChallenge = {
        ...challenge,
        description: prepareChallengeDescription(challenge.description),
      };
      const { data: cases } = await supabase
        .from("test_cases")
        .select("*")
        .eq("challenge_id", challenge.id)
        .order("order_index");
      testCases = cases || [];
    }
  }

  // Soal CSS & Web: tabelnya hanya bisa dibaca staf (kunci jawaban ada di sana), jadi
  // diambil lewat service role setelah akses materi dicek di atas. Kolom reference_*
  // (kunci jawaban) tidak dikirim ke browser; penilaian AI mengambilnya sendiri di server.
  const admin = createAdminClient();

  // Fetch CSS challenge if lesson type is 'css-challenge'
  let cssChallenge = null;
  if (lesson.type === "css-challenge") {
    const { data: challenge } = await admin
      .from("css_challenges")
      .select("id, lesson_id, title, description, starter_html, starter_css, max_score, max_attempts")
      .eq("lesson_id", id)
      .single();
    if (challenge) {
      cssChallenge = {
        ...challenge,
        description: prepareChallengeDescription(challenge.description),
      };
    }
  }

  // Fetch Web challenge if lesson type is 'web-challenge'
  let webChallenge = null;
  if (lesson.type === "web-challenge") {
    const { data: challenge } = await admin
      .from("web_challenges")
      .select(
        "id, lesson_id, title, description, mode, starter_html, starter_css, starter_js, max_score, max_attempts",
      )
      .eq("lesson_id", id)
      .single();
    if (challenge) {
      webChallenge = {
        ...challenge,
        description: prepareChallengeDescription(challenge.description),
      };
    }
  }

  const subjectId = (lesson.module_id as any).subject_id;
  const moduleTitle = (lesson.module_id as any).title;
  const isCodingLesson =
    lesson.type === "code" ||
    lesson.type === "css-challenge" ||
    lesson.type === "web-challenge";

  const waButton = (
    <WhatsAppButton topic={lesson.title} labelClassName={styles.waLabel} />
  );

  // ── IDE layout for coding challenges ──────────────────────────────────
  if (isCodingLesson) {
    return (
      <div className={styles.ideShell}>
        {/* Slim IDE header — 48px */}
        <header className={styles.ideHeader}>
          <Link href={`/subjects/${subjectId}`} className={styles.ideBack}>
            ← {moduleTitle}
          </Link>
          <div className={styles.headerActions}>
            {waButton}
            <Image
              src="/images/Logo transparent orange.webp"
              alt="Supercoder"
              width={78}
              height={26}
              className={styles.ideBrand}
            />
          </div>
        </header>

        {/* IDE body — fills remaining viewport (desktop) */}
        <div className={styles.ideBody}>
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
          {lesson.type === "web-challenge" && webChallenge && (
            <WebChallenge
              challenge={webChallenge}
              existingSubmission={webSubmission}
            />
          )}
          {lesson.type === "web-challenge" && !webChallenge && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>🕸️</span>
              <p>Soal Coding Web untuk materi ini belum dibuat oleh guru.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Standard layout for non-coding lesson types ───────────────────────
  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("title")
    .eq("id", subjectId)
    .maybeSingle();
  const type = lessonTypeTheme(lesson.type);

  return (
    <div className={ui.shell}>
      <StudentTopBar profile={viewer} email={user.email} />

      <main className={`${ui.page} ${ui.pageNarrow}`}>
        <nav className={ui.breadcrumb} aria-label="Navigasi">
          <div className={ui.crumbs}>
            <Link href={`/subjects/${subjectId}`} className={ui.crumbLink}>
              ← {subjectRow?.title ?? "Mata Pelajaran"}
            </Link>
            <span>/</span>
            <span className={ui.crumbCurrent}>{moduleTitle}</span>
          </div>
          {waButton}
        </nav>

        <div className={ui.mainColumn}>
          {/* HERO */}
          <section className={ui.hero}>
            <div className={ui.heroText}>
              <p className={ui.heroLabel}>{type.label}</p>
              <h1 className={ui.heroTitle}>{lesson.title}</h1>
              <p className={ui.heroSubtitle}>{lesson.description || moduleTitle}</p>
            </div>
            <div
              className={ui.heroIcon}
              style={{ background: type.gradient }}
              aria-hidden="true"
            >
              {type.icon}
            </div>
          </section>

          {lessonScore && (
            <div className={ui.scoreBox}>
              <div>
                <p className={ui.scoreTitle}>🏆 Nilai Materi</p>
                <p className={ui.scoreMeta}>
                  Dinilai pada{" "}
                  {new Date(lessonScore.graded_at).toLocaleDateString("id-ID")}
                  {lessonScore.feedback && (
                    <span className={ui.scoreFeedback}>
                      &quot;{lessonScore.feedback}&quot;
                    </span>
                  )}
                </p>
              </div>
              <div className={ui.scoreValue}>
                {lessonScore.score}
                <span className={ui.scoreUnit}> / 100</span>
              </div>
            </div>
          )}

          {/* Material Viewer */}
          {lesson.type === "video" && (
            <div className={ui.contentCard} style={{ padding: "12px" }}>
              <div
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                  overflow: "hidden",
                  borderRadius: "14px",
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
            </div>
          )}

          {(lesson.type === "pdf" || lesson.type === "link") && (
            <div className={ui.contentCard} style={{ textAlign: "center", padding: "40px 24px" }}>
              <span className={ui.emptyEmoji} aria-hidden="true">
                {type.icon}
              </span>
              <h2 className={ui.cardTitle}>
                {lesson.type === "pdf" ? "Materi Pembelajaran (PDF)" : "Sumber Eksternal"}
              </h2>
              <p className={ui.panelText}>
                {lesson.type === "pdf"
                  ? "Buka dokumen di bawah ini untuk mempelajari materinya."
                  : "Ikuti link di bawah ini untuk mengakses materi pembelajaran."}
              </p>
              <a
                href={lesson.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className={ui.primaryBtn}
              >
                {lesson.type === "pdf" ? "📄 Buka PDF" : "🔗 Buka Link"}
              </a>
            </div>
          )}

          {lesson.type === "text" && (
            <div className={ui.contentCard} style={{ lineHeight: 1.8 }}>
              {lesson.content_url ? (
                <ChallengeDescription
                  description={prepareChallengeDescription(lesson.content_url)}
                  className="whitespace-pre-wrap"
                />
              ) : (
                <p className={ui.panelText}>Konten teks akan muncul di sini.</p>
              )}
            </div>
          )}

          {lesson.type === "quiz" && (
            <div className={ui.contentCard}>
              <QuizView lessonId={lesson.id} />
            </div>
          )}

          {lesson.is_project_required && <ProjectSubmission lessonId={lesson.id} />}
        </div>
      </main>
    </div>
  );
}
