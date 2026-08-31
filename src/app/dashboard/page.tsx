import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";

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

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("is_active", true);

  const xpPercent = Math.min((profile.xp / 1000) * 100, 100);

  return (
    <div className="container">
      <div className={styles.dashboardGrid}>
        {/* Welcome Header */}
        <div className={styles.welcomeCard}>
          <div>
            <h1>Halo, {profile.full_name || user.email?.split("@")[0]}! 👋</h1>
            <p>Siap untuk meningkatkan skill coding Anda hari ini?</p>
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Link
                href="/dashboard/testimonials"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
                className="hover:bg-white/25 transition-colors"
              >
                <span>⭐</span> Beri Testimoni
              </Link>

              {(profile.role === "admin" || profile.role === "teacher") && (
                <Link
                  href="/admin/users"
                  className="btn btn-primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.875rem",
                  }}
                >
                  Buka Panel Admin ⚙️
                </Link>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#94A3B8",
                marginBottom: "4px",
              }}
            >
              LEVEL SAAT INI
            </div>
            <div
              style={{ fontSize: "2.5rem", fontWeight: 800, color: "white" }}
            >
              Lvl {profile.level}
            </div>
            <form action={signOut} style={{ marginTop: "12px" }}>
              <button
                type="submit"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Log Out 🚪
              </button>
            </form>
          </div>
        </div>

        {/* Subjects Section (Left Side - 8 Columns) */}
        <div className={styles.subjectGrid}>
          {subjects?.map((subject) => (
            <Link
              href={`/subjects/${subject.id}`}
              key={subject.id}
              className={styles.subjectCard}
            >
              <div className={styles.subjectIcon}>💻</div>
              <div>
                <h3 style={{ marginBottom: "8px" }}>{subject.title}</h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748B",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {subject.description}
                </p>
              </div>
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="badge badge-xp">Coding</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6366F1",
                    fontWeight: 600,
                  }}
                >
                  Mulai Belajar →
                </span>
              </div>
            </Link>
          ))}
          {subjects?.length === 0 && (
            <div
              className="card"
              style={{
                gridColumn: "span 2",
                textAlign: "center",
                padding: "60px",
              }}
            >
              <p style={{ color: "#64748B" }}>
                Belum ada materi tersedia. Cek lagi nanti ya!
              </p>
            </div>
          )}
        </div>

        {/* Sidebar (Right Side - 4 Columns) */}
        <div className={styles.sidebar}>
          {/* Stats Section */}
          <div className={styles.statCard}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <h3 style={{ marginBottom: "24px", alignSelf: "flex-start" }}>
                Progres Saya
              </h3>

              <div
                className={styles.xpCircle}
                style={{ "--xp-percent": xpPercent } as React.CSSProperties}
              >
                <div className={styles.xpCircleContent}>
                  {profile.xp}
                  <span>XP</span>
                </div>
              </div>

              <p style={{ fontWeight: 600, marginTop: "8px" }}>
                Terus kumpulkan XP!
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#64748B",
                  marginTop: "4px",
                }}
              >
                Selesaikan modul dan kuis untuk dapat lebih banyak XP.
              </p>
            </div>

            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid var(--border)",
                width: "100%",
              }}
            >
              <Link
                href="/leaderboard"
                style={{
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Lihat Papan Peringkat →
              </Link>
            </div>
          </div>

          {/* Achievements / Notifications */}
          <div className={styles.leaderboardCard}>
            <h3 style={{ marginBottom: "20px" }}>Lencana Terbaru</h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
                title="Pemula"
              >
                🌱
              </div>
            </div>
            <p
              style={{
                marginTop: "24px",
                fontSize: "0.875rem",
                color: "#64748B",
              }}
            >
              Buka lebih banyak lencana dengan menyelesaikan modul!
            </p>
          </div>

          {/* Testimonial Banner Card */}
          <div
            style={{
              backgroundColor: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>💬</span>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#92400E",
                  margin: 0,
                }}
              >
                Testimoni Belajar
              </h3>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#78350F",
                lineHeight: 1.5,
                marginBottom: "16px",
              }}
            >
              Bagikan pengalaman dan masukan belajarmu di Supercoder untuk bantu
              kami jadi lebih baik!
            </p>
            <Link
              href="/dashboard/testimonials"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: "#F59E0B",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                width: "100%",
              }}
              className="hover:bg-amber-600 transition-colors shadow-xs"
            >
              Beri Testimoni Sekarang →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
