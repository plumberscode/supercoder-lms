import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  blockedStudentPath,
  followsLessonSequence,
  isStaff,
  lockedBySequence,
  moduleVisibility,
  PASSING_SCORE,
} from "@/lib/student-access";
import { loadBestScores } from "@/lib/lesson-access";
import UpgradeCta from "@/components/UpgradeCta";
import Link from "next/link";
import StudentTopBar from "@/components/student/StudentTopBar";
import WhatsAppButton from "@/components/student/WhatsAppButton";
import ProgressRing from "@/components/student/ProgressRing";
import {
  LOCKED_GRADIENT,
  lessonTypeTheme,
  subjectTheme,
} from "@/components/student/themes";
import ui from "@/components/student/student.module.css";

type LessonStatus = "done" | "retry" | "pending" | "new";

export default async function SubjectPage({
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

  const [{ data: subject }, { data: activeSubjects }] = await Promise.all([
    supabase
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
      .single(),
    // Untuk ikon/warna yang sama dengan kartu kursus di dashboard.
    supabase
      .from("subjects")
      .select("id, modules(programs)")
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
  ]);

  // Modul terbuka bisa dikerjakan; modul terkunci (khusus teaser) hanya tampil judulnya.
  const modules = (subject?.modules ?? [])
    .map((m: any) => ({
      ...m,
      visibility: moduleVisibility(viewer, m.programs),
      lessons: [...(m.lessons ?? [])].sort(
        (a: any, b: any) => a.order_index - b.order_index,
      ),
    }))
    .filter((m: any) => m.visibility !== "hidden")
    .sort((a: any, b: any) => a.order_index - b.order_index);
  const hasLockedModules = modules.some((m: any) => m.visibility === "locked");

  if (!subject || modules.length === 0) {
    return (
      <div className={ui.shell}>
        <StudentTopBar profile={viewer} email={user.email} />
        <main className={ui.page}>
          <div className={ui.emptyState}>
            <span className={ui.emptyEmoji}>🔍</span>
            <p>Mata pelajaran tidak ditemukan.</p>
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

  const visibleSubjectIds = (activeSubjects ?? [])
    .filter((s: any) =>
      (s.modules ?? []).some(
        (m: any) => moduleVisibility(viewer, m.programs) !== "hidden",
      ),
    )
    .map((s: any) => s.id);
  const openModules = modules.filter((m: any) => m.visibility === "open");
  const isSubjectLocked = openModules.length === 0;
  const theme = subjectTheme(visibleSubjectIds.indexOf(subject.id));

  // ── Status materi dari submission ──────────────────────────────────────
  const openLessons = openModules.flatMap((m: any) => m.lessons);
  const lessonIds: string[] = openLessons.map((l: any) => l.id as string);
  const bestScore = await loadBestScores(supabase, user.id, lessonIds);

  // Teaser: materi berikutnya baru terbuka setelah materi sebelumnya lulus.
  const isSequential = followsLessonSequence(viewer);
  const sequenceLocked = isSequential
    ? lockedBySequence(openLessons, bestScore)
    : new Set<string>();

  const statusOf = (lessonId: string): LessonStatus => {
    if (!bestScore.has(lessonId)) return "new";
    const score = bestScore.get(lessonId);
    if (score === null || score === undefined) return "pending";
    return score >= PASSING_SCORE ? "done" : "retry";
  };

  const doneCount = lessonIds.filter((lid) => statusOf(lid) === "done").length;
  const totalLessons = lessonIds.length;
  const percent = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;
  const nextLesson =
    openLessons.find((l: any) => statusOf(l.id) !== "done") ?? openLessons[0];
  const hasStarted = bestScore.size > 0;

  return (
    <div className={ui.shell}>
      <StudentTopBar profile={viewer} email={user.email} />

      <main className={ui.page}>
        <nav className={ui.breadcrumb} aria-label="Navigasi">
          <div className={ui.crumbs}>
            <Link href="/dashboard" className={ui.crumbLink}>
              ← Dashboard
            </Link>
            <span>/</span>
            <span className={ui.crumbCurrent}>{subject.title}</span>
          </div>
        </nav>

        <div className={ui.layout}>
          <div className={ui.mainColumn}>
            {/* HERO */}
            <section className={ui.hero}>
              <div className={ui.heroText}>
                <p className={ui.heroLabel}>Mata Pelajaran</p>
                <h1 className={ui.heroTitle}>{subject.title}</h1>
                {subject.description && (
                  <p className={ui.heroSubtitle}>{subject.description}</p>
                )}
                {nextLesson && (
                  <div className={ui.heroActions}>
                    <Link href={`/lessons/${nextLesson.id}`} className={ui.primaryBtn}>
                      {percent === 100
                        ? "🔁 Ulangi Materi"
                        : hasStarted
                          ? "🚀 Lanjutkan Belajar"
                          : "🚀 Mulai Belajar"}
                    </Link>
                  </div>
                )}
              </div>
              <div
                className={ui.heroIcon}
                style={{ background: isSubjectLocked ? LOCKED_GRADIENT : theme.gradient }}
                aria-hidden="true"
              >
                {isSubjectLocked ? "🔒" : theme.icon}
              </div>
            </section>

            {/* STAT CARDS */}
            <div className={ui.statRow}>
              <div className={ui.statCard}>
                <div
                  className={ui.statIcon}
                  style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)" }}
                >
                  📚
                </div>
                <div>
                  <p className={ui.statLabel}>Modul</p>
                  <p className={ui.statValue}>{modules.length}</p>
                </div>
              </div>
              <div className={ui.statCard}>
                <div
                  className={ui.statIcon}
                  style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}
                >
                  📝
                </div>
                <div>
                  <p className={ui.statLabel}>Materi</p>
                  <p className={ui.statValue}>{totalLessons}</p>
                </div>
              </div>
              <div className={ui.statCard}>
                <div
                  className={ui.statIcon}
                  style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}
                >
                  ✅
                </div>
                <div>
                  <p className={ui.statLabel}>Selesai</p>
                  <p className={ui.statValue}>
                    {doneCount}
                    <span className={ui.statValueUnit}> / {totalLessons}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* MODULES */}
            <div className={ui.sectionHeader}>
              <h2 className={ui.sectionTitle}>Daftar Modul</h2>
              <span className={ui.sectionCount}>{modules.length} modul</span>
            </div>

            {isSequential && sequenceLocked.size > 0 && (
              <p className={ui.sequenceNote}>
                🔐 Kerjakan materi secara berurutan. Materi berikutnya terbuka setelah
                kamu lulus materi sebelumnya (nilai minimal {PASSING_SCORE}).
              </p>
            )}

            {modules.map((module: any, moduleIndex: number) => {
              const locked = module.visibility === "locked";
              const lessons = module.lessons as any[];
              const moduleDone = locked
                ? 0
                : lessons.filter((l) => statusOf(l.id) === "done").length;
              const modulePercent = lessons.length
                ? Math.round((moduleDone / lessons.length) * 100)
                : 0;

              return (
                <section key={module.id} className={ui.moduleCard}>
                  <div className={ui.moduleHeader}>
                    <div
                      className={`${ui.moduleNumber} ${locked ? ui.moduleNumberLocked : ""}`}
                    >
                      {locked ? "🔒" : moduleIndex + 1}
                    </div>
                    <div className={ui.moduleHeading}>
                      <h3 className={ui.moduleTitle}>{module.title}</h3>
                      <div className={ui.moduleMeta}>
                        {locked ? (
                          <span className={ui.lockPill}>🔒 Kelas Supercoder</span>
                        ) : (
                          <>
                            <div className={ui.moduleTrack} aria-hidden="true">
                              <div
                                className={ui.moduleFill}
                                style={{ width: `${modulePercent}%` }}
                              />
                            </div>
                            <span>
                              {moduleDone}/{lessons.length} selesai
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <ul className={ui.lessonList}>
                    {lessons.map((lesson) => {
                      const type = lessonTypeTheme(lesson.type);
                      const waiting = !locked && sequenceLocked.has(lesson.id);
                      const status = locked ? null : statusOf(lesson.id);
                      const score = bestScore.get(lesson.id);
                      const content = (
                        <>
                          <div
                            className={ui.lessonIcon}
                            style={{
                              background:
                                locked || waiting ? LOCKED_GRADIENT : type.gradient,
                            }}
                            aria-hidden="true"
                          >
                            {type.icon}
                          </div>
                          <div className={ui.lessonInfo}>
                            <div className={ui.lessonTitle}>{lesson.title}</div>
                            <div className={ui.lessonMeta}>
                              {type.label}
                              {lesson.description && ` • ${lesson.description}`}
                            </div>
                          </div>
                          {locked ? (
                            <span className={`${ui.status} ${ui.statusLocked}`}>🔒</span>
                          ) : waiting ? (
                            <span
                              className={`${ui.status} ${ui.statusLocked}`}
                              title="Lulus materi sebelumnya dulu untuk membuka materi ini"
                            >
                              🔒<span className={ui.statusText}> Terkunci</span>
                            </span>
                          ) : status === "done" ? (
                            <span
                              className={`${ui.status} ${ui.statusDone}`}
                              title={`Selesai (skor ${score})`}
                            >
                              ✓<span className={ui.statusText}> Selesai</span>
                            </span>
                          ) : status === "retry" ? (
                            <span
                              className={`${ui.status} ${ui.statusRetry}`}
                              title="Belum mencapai nilai 70, coba lagi"
                            >
                              {score}
                              <span className={ui.statusText}> · Coba lagi</span>
                            </span>
                          ) : status === "pending" ? (
                            <span
                              className={`${ui.status} ${ui.statusPending}`}
                              title="Sudah dikirim, menunggu dinilai guru"
                            >
                              ⏳<span className={ui.statusText}> Dinilai</span>
                            </span>
                          ) : (
                            <span className={`${ui.status} ${ui.statusStart}`}>
                              Mulai →
                            </span>
                          )}
                        </>
                      );

                      return (
                        <li key={lesson.id}>
                          {locked || waiting ? (
                            <div className={`${ui.lessonRow} ${ui.lessonRowLocked}`}>
                              {content}
                            </div>
                          ) : (
                            <Link href={`/lessons/${lesson.id}`} className={ui.lessonRow}>
                              {content}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}

            {hasLockedModules && <UpgradeCta />}
          </div>

          {/* RIGHT PANEL */}
          <aside className={ui.rightPanel}>
            <div className={ui.panelCard}>
              <div className={ui.panelCardHeader}>
                <h3 className={ui.panelTitle}>Progres Kamu</h3>
              </div>
              <ProgressRing percent={percent} value={`${percent}%`} label="Selesai" />
              <p className={ui.ringCaption}>
                {totalLessons === 0
                  ? "Belum ada materi terbuka."
                  : percent === 100
                    ? "🎉 Semua materi sudah kamu selesaikan!"
                    : `${totalLessons - doneCount} materi lagi untuk menyelesaikan kursus ini`}
              </p>
            </div>

            <div className={ui.panelCard}>
              <div className={ui.panelCardHeader}>
                <h3 className={ui.panelTitle}>Butuh Bantuan?</h3>
              </div>
              <p className={ui.panelText}>
                Ada yang bikin bingung di materi ini? Tanya langsung ke instruktur
                lewat WhatsApp.
              </p>
              <WhatsAppButton topic={subject.title} block />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
