import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { signOut } from "@/app/auth/actions";

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function xpColor(type: string): string {
  if (type === "quiz") return "#f97316";
  if (type === "lesson") return "#3b82f6";
  return "#10b981";
}

function xpIcon(type: string): string {
  if (type === "quiz") return "🧠";
  if (type === "lesson") return "📖";
  return "✅";
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "approved") {
    redirect("/pending-approval");
  }

  // Subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Recent activity from submissions (lesson + quiz)
  const { data: recentActivity } = await supabase
    .from("submissions")
    .select(
      `
      id,
      type,
      score,
      submitted_at,
      lessons ( title, modules ( subjects ( title ) ) )
    `
    )
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(5);

  // Find HTML & CSS subject for new students
  const htmlCssSubject =
    subjects?.find((s) => s.title.toLowerCase().includes("html")) ||
    subjects?.find((s) => s.order_index === 1) ||
    subjects?.[0];

  // Determine if student has previous learning activity and find last lesson
  const { data: latestSubmission } = await supabase
    .from("submissions")
    .select("id, type, content_id, submitted_at")
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let continueLearningUrl = htmlCssSubject ? `/subjects/${htmlCssSubject.id}` : "#";
  let isReturningStudent = false;

  if (latestSubmission) {
    isReturningStudent = true;
    let targetLessonId: string | null = null;

    if (latestSubmission.type === "quiz") {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("lesson_id")
        .eq("id", latestSubmission.content_id)
        .maybeSingle();

      targetLessonId = quizData?.lesson_id || latestSubmission.content_id;
    } else {
      targetLessonId = latestSubmission.content_id;
    }

    if (targetLessonId) {
      const { data: targetLesson } = await supabase
        .from("lessons")
        .select("id, title, module_id, modules ( id, title, subject_id, subjects ( id, title ) )")
        .eq("id", targetLessonId)
        .maybeSingle();

      if (targetLesson) {
        continueLearningUrl = `/lessons/${targetLesson.id}`;
      }
    }
  }

  // Top leaderboard
  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, full_name, xp, level")
    .eq("status", "approved")
    .eq("role", "student")
    .order("xp", { ascending: false })
    .limit(5);

  // Stats
  const { count: completedModules } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("type", "lesson");

  const { count: completedQuizzes } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("type", "quiz");

  const xpToNextLevel = (profile.level + 1) * (profile.level + 1) * 100;
  const xpThisLevel = profile.level * profile.level * 100;
  const xpProgress =
    xpThisLevel >= xpToNextLevel
      ? 100
      : Math.min(
          Math.round(
            ((profile.xp - xpThisLevel) / (xpToNextLevel - xpThisLevel)) * 100
          ),
          100
        );

  // SVG ring params
  const RING_R = 52;
  const RING_CIRC = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRC * (1 - xpProgress / 100);

  const myRank =
    leaderboard?.findIndex((p) => p.id === profile.id) ?? -1;

  const firstName = (profile.full_name || user.email?.split("@")[0] || "Coder")
    .split(" ")[0];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.dashboardShell}>
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.topBarContainer}>
          <div className={styles.topBarBrand}>
            <Image
              src="/images/Logo transparent orange.webp"
              alt="Supercoder"
              width={140}
              height={40}
              className={styles.brandLogo}
            />
          </div>

          <div className={styles.topBarRight}>
            {(profile.role === "admin" || profile.role === "teacher") && (
              <Link href="/admin/users" className={styles.adminPill}>
                ⚙️ Admin
              </Link>
            )}
            <div className={styles.levelPill}>
              <span className={styles.levelIcon}>⚡</span>
              <span>Level {profile.level}</span>
            </div>
            <div className={styles.userAvatar}>
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ─────────────────────────────────────── */}
      <main className={styles.mainLayout}>
        {/* ── LEFT / MAIN CONTENT ─────────────────────────── */}
        <div className={styles.mainContent}>
          {/* HERO BANNER */}
          <div className={styles.heroBanner}>
            {/* text side */}
            <div className={styles.heroText}>
              <p className={styles.heroLabel}>Dashboard Siswa</p>
              <h1 className={styles.heroTitle}>
                Halo, {firstName}! 👋
              </h1>
              <p className={styles.heroSubtitle}>
                {isReturningStudent
                  ? "Siap melanjutkan pembelajaranmu hari ini?"
                  : "Siap membangun sesuatu yang keren hari ini?"}
              </p>

              <div className={styles.heroActions}>
                <Link
                  href={continueLearningUrl}
                  className={styles.heroCTA}
                >
                  {isReturningStudent ? "🚀 Lanjutkan Belajar" : "🚀 Mulai Belajar"}
                </Link>
                <Link
                  href="/dashboard/testimonials"
                  className={styles.heroSecondary}
                >
                  ⭐ Beri Testimoni
                </Link>
              </div>
            </div>

            {/* mascot side */}
            <div className={styles.heroMascot}>
              <Image
                src="/images/dashboard-mascot.webp"
                alt="HTML JS CSS mascots"
                width={340}
                height={253}
                priority
                className={styles.mascotImage}
                sizes="(max-width: 768px) 200px, 340px"
              />
            </div>
          </div>

          {/* STAT CARDS ROW */}
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}
              >
                📚
              </div>
              <div>
                <p className={styles.statLabel}>Modul Selesai</p>
                <p className={styles.statValue}>{completedModules ?? 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}
              >
                🧠
              </div>
              <div>
                <p className={styles.statLabel}>Quiz Dikerjakan</p>
                <p className={styles.statValue}>{completedQuizzes ?? 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ background: "linear-gradient(135deg,#ede9fe,#ddd6fe)" }}
              >
                ⚡
              </div>
              <div>
                <p className={styles.statLabel}>Total XP</p>
                <p className={styles.statValue}>{profile.xp}</p>
              </div>
            </div>

            {myRank >= 0 && (
              <div className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{
                    background: "linear-gradient(135deg,#fee2e2,#fecaca)",
                  }}
                >
                  🏆
                </div>
                <div>
                  <p className={styles.statLabel}>Peringkat</p>
                  <p className={styles.statValue}>#{myRank + 1}</p>
                </div>
              </div>
            )}
          </div>

          {/* SUBJECT GRID */}
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Materi Belajar</h2>
              <span className={styles.sectionCount}>
                {subjects?.length ?? 0} kursus tersedia
              </span>
            </div>

            <div className={styles.subjectGrid}>
              {subjects?.map((subject, i) => {
                const icons = ["💻", "🎨", "⚡", "🔧", "🌐", "🛠️"];
                const gradients = [
                  "linear-gradient(135deg,#eef2ff,#e0e7ff)",
                  "linear-gradient(135deg,#fef3c7,#fde68a)",
                  "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                  "linear-gradient(135deg,#ffe4e6,#fecdd3)",
                  "linear-gradient(135deg,#ede9fe,#ddd6fe)",
                  "linear-gradient(135deg,#e0f2fe,#bae6fd)",
                ];
                return (
                  <Link
                    href={`/subjects/${subject.id}`}
                    key={subject.id}
                    className={styles.subjectCard}
                  >
                    <div
                      className={styles.subjectIconWrap}
                      style={{ background: gradients[i % gradients.length] }}
                    >
                      <span className={styles.subjectIconEmoji}>
                        {icons[i % icons.length]}
                      </span>
                    </div>
                    <h3 className={styles.subjectName}>{subject.title}</h3>
                    <p className={styles.subjectDesc}>{subject.description}</p>
                    <div className={styles.subjectFooter}>
                      <span className={styles.subjectTag}>Coding</span>
                      <span className={styles.subjectCTA}>
                        Mulai →
                      </span>
                    </div>
                  </Link>
                );
              })}

              {(!subjects || subjects.length === 0) && (
                <div className={styles.emptyState}>
                  <p>Belum ada materi tersedia. Cek lagi nanti! 🕐</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────── */}
        <aside className={styles.rightPanel}>
          {/* XP PROGRESS */}
          <div className={styles.panelCard}>
            <div className={styles.panelCardHeader}>
              <h3 className={styles.panelTitle}>Progres XP</h3>
              <Link href="/leaderboard" className={styles.panelLink}>
                Papan →
              </Link>
            </div>

            <div className={styles.xpRingWrap}>
              <svg
                width="128"
                height="128"
                viewBox="0 0 128 128"
                className={styles.xpSvg}
              >
                {/* track */}
                <circle
                  cx="64"
                  cy="64"
                  r={RING_R}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                {/* progress */}
                <circle
                  cx="64"
                  cy="64"
                  r={RING_R}
                  fill="none"
                  stroke="url(#xpGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 64 64)"
                />
                <defs>
                  <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>

              <div className={styles.xpRingCenter}>
                <span className={styles.xpNumber}>{profile.xp}</span>
                <span className={styles.xpLabel}>XP</span>
              </div>
            </div>

            <p className={styles.xpCaption}>
              {xpProgress}% menuju Level {profile.level + 1}
            </p>

            <form action={signOut} className={styles.signOutForm}>
              <button type="submit" className={styles.signOutBtn}>
                Keluar 🚪
              </button>
            </form>
          </div>

          {/* RECENT ACTIVITY */}
          <div className={styles.panelCard}>
            <div className={styles.panelCardHeader}>
              <h3 className={styles.panelTitle}>Aktivitas Terbaru</h3>
            </div>

            {recentActivity && recentActivity.length > 0 ? (
              <ul className={styles.activityList}>
                {recentActivity.map((item: any) => {
                  const lessonTitle =
                    item.lessons?.title ?? "—";
                  const subjectTitle =
                    item.lessons?.modules?.subjects?.title ?? "";
                  return (
                    <li key={item.id} className={styles.activityItem}>
                      <div
                        className={styles.activityIcon}
                        style={{ background: xpColor(item.type) }}
                      >
                        {xpIcon(item.type)}
                      </div>
                      <div className={styles.activityInfo}>
                        <p className={styles.activityTitle}>{lessonTitle}</p>
                        {subjectTitle && (
                          <p className={styles.activitySub}>{subjectTitle}</p>
                        )}
                        <p className={styles.activityMeta}>
                          {item.score != null && (
                            <span className={styles.activityScore}>
                              Skor {item.score}
                            </span>
                          )}
                          {timeAgo(item.submitted_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.emptyText}>
                Belum ada aktivitas. Yuk mulai belajar! 🚀
              </p>
            )}
          </div>

          {/* LEADERBOARD MINI */}
          <div className={styles.panelCard}>
            <div className={styles.panelCardHeader}>
              <h3 className={styles.panelTitle}>Top Siswa</h3>
              <Link href="/leaderboard" className={styles.panelLink}>
                Lihat Semua →
              </Link>
            </div>

            <ul className={styles.leaderList}>
              {leaderboard?.slice(0, 5).map((p, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const isMe = p.id === profile.id;
                return (
                  <li
                    key={p.id}
                    className={`${styles.leaderItem} ${isMe ? styles.leaderItemMe : ""}`}
                  >
                    <span className={styles.leaderRank}>
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </span>
                    <div className={styles.leaderAvatar}>
                      {(p.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.leaderInfo}>
                      <p className={styles.leaderName}>
                        {p.full_name || "Anonim"}
                        {isMe && (
                          <span className={styles.meBadge}> (Kamu)</span>
                        )}
                      </p>
                      <p className={styles.leaderXp}>⚡ {p.xp} XP</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* TESTIMONI BANNER */}
          <div className={styles.testimoniBanner}>
            <span className={styles.testimoniEmoji}>💬</span>
            <div>
              <p className={styles.testimoniTitle}>Bagikan Pengalamanmu</p>
              <p className={styles.testimoniDesc}>
                Bantu kami jadi lebih baik!
              </p>
            </div>
            <Link href="/dashboard/testimonials" className={styles.testimoniCTA}>
              Tulis →
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
