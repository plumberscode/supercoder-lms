import { formatPeriod, PASS_SCORE, type ReportSnapshot } from "@/lib/reports";
import styles from "./report.module.css";

const typeLabel: Record<string, string> = {
  quiz: "Kuis",
  project: "Proyek",
  lesson: "Materi",
  code: "Tantangan Kode",
  css: "Tantangan CSS",
  web: "Tantangan Web",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Makassar",
  });
}

function scoreClass(score: number | null) {
  if (score === null) return styles.scorePending;
  return score >= PASS_SCORE ? styles.scoreGood : styles.scoreLow;
}

export default function ReportView({
  snapshot,
  notes,
}: {
  snapshot: ReportSnapshot;
  notes: {
    strengths: string | null;
    improvements: string | null;
    parent_advice: string | null;
  };
}) {
  const { student, totals, subjects, activities, achievements } = snapshot;
  const overallPct =
    totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;

  const noteSections = [
    { title: "💪 Kekuatan", body: notes.strengths },
    { title: "🎯 Yang Perlu Ditingkatkan", body: notes.improvements },
    { title: "🏠 Saran untuk Orang Tua", body: notes.parent_advice },
  ].filter((n) => n.body?.trim());

  return (
    <article className={styles.report}>
      <header className={styles.header}>
        <div className={styles.brand}>
          Super<span>coder</span>
        </div>
        <div className={styles.headerTitle}>Rapor Belajar Bulanan</div>
        <h1 className={styles.studentName}>{student.name}</h1>
        <div className={styles.period}>{formatPeriod(snapshot.period)}</div>
      </header>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{totals.monthCount}</div>
          <div className={styles.statLabel}>Tugas dikerjakan bulan ini</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{totals.monthAverage ?? "–"}</div>
          <div className={styles.statLabel}>Rata-rata nilai bulan ini</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{overallPct}%</div>
          <div className={styles.statLabel}>Progres keseluruhan</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>Lv {student.level}</div>
          <div className={styles.statLabel}>{student.xp} XP</div>
        </div>
      </section>

      {noteSections.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Catatan Guru</h2>
          {noteSections.map((n) => (
            <div key={n.title} className={styles.note}>
              <div className={styles.noteTitle}>{n.title}</div>
              <p className={styles.noteBody}>{n.body}</p>
            </div>
          ))}
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Progres per Mata Pelajaran</h2>
        {subjects.length === 0 ? (
          <p className={styles.empty}>Belum ada mata pelajaran yang dikerjakan.</p>
        ) : (
          subjects.map((s) => (
            <div key={s.title} className={styles.subject}>
              <div className={styles.subjectRow}>
                <span className={styles.subjectTitle}>{s.title}</span>
                <span className={styles.subjectMeta}>
                  {s.completed}/{s.total} materi selesai
                </span>
              </div>
              <div className={styles.bar}>
                <div className={styles.barFill} style={{ width: `${s.progressPct}%` }} />
              </div>
              <div className={styles.subjectMeta}>
                Bulan ini: {s.monthCount} tugas
                {s.monthAverage !== null && <> · rata-rata {s.monthAverage}</>}
              </div>
            </div>
          ))
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Aktivitas Bulan Ini</h2>
        {activities.length === 0 ? (
          <p className={styles.empty}>Tidak ada aktivitas tercatat pada bulan ini.</p>
        ) : (
          <ul className={styles.activityList}>
            {activities.map((a, i) => (
              <li key={i} className={styles.activity}>
                <div className={styles.activityMain}>
                  <div className={styles.activityTitle}>{a.lesson}</div>
                  <div className={styles.activityMeta}>
                    {formatDate(a.date)} · {a.subject} · {typeLabel[a.type] || a.type}
                  </div>
                  {a.feedback && (
                    <div className={styles.activityFeedback}>“{a.feedback}”</div>
                  )}
                </div>
                <div className={`${styles.score} ${scoreClass(a.score)}`}>
                  {a.score ?? "Menunggu"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {achievements.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pencapaian Baru 🏆</h2>
          <div className={styles.badges}>
            {achievements.map((a) => (
              <div key={a.title + a.earnedAt} className={styles.badge}>
                <div className={styles.badgeTitle}>{a.title}</div>
                {a.description && <div className={styles.badgeDesc}>{a.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        Nilai ≥ {PASS_SCORE} dihitung sebagai materi selesai. Rapor dibuat oleh Supercoder.
      </footer>
    </article>
  );
}
