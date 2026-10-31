import { Award } from "lucide-react";
import {
  formatPeriod,
  PASS_SCORE,
  REPORT_SOURCE_LABELS,
  type ReportActivity,
  type ReportSnapshot,
} from "@/lib/reports";
import styles from "./report.module.css";

export interface ReportNotes {
  month_note?: string | null;
  strengths: string | null;
  improvements: string | null;
  parent_advice: string | null;
}

function datePart(iso: string, part: "day" | "month") {
  return new Date(iso).toLocaleDateString(
    "id-ID",
    part === "day"
      ? { day: "numeric", timeZone: "Asia/Makassar" }
      : { month: "short", timeZone: "Asia/Makassar" },
  );
}

function tone(score: number | null) {
  if (score === null) return styles.none;
  return score >= PASS_SCORE ? styles.good : styles.warn;
}

// Nilai guru berupa XP tampil sebagai "+N XP": materi selesai, bukan nilai 0–100.
function ActivityBadge({ a }: { a: ReportActivity }) {
  if (a.score === null && a.xp != null) {
    return <span className={`${styles.badge} ${styles.good}`}>+{a.xp} XP</span>;
  }
  return <span className={`${styles.badge} ${tone(a.score)}`}>{a.score ?? "Menunggu"}</span>;
}

function compare(current: number | null, previous: number | null | undefined, unit: string) {
  if (current === null || previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return { text: "Sama dengan bulan lalu", cls: "" };
  return diff > 0
    ? { text: `Naik ${diff} ${unit} dari bulan lalu`, cls: styles.up }
    : { text: `Turun ${-diff} ${unit} dari bulan lalu`, cls: styles.down };
}

export default function ReportView({
  snapshot,
  notes,
}: {
  snapshot: ReportSnapshot;
  notes: ReportNotes;
}) {
  const { student, totals, subjects, achievements, previous } = snapshot;
  const activities = [...snapshot.activities].reverse(); // terbaru di atas
  const overallPct = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;
  const hasNewData = snapshot.activeDays !== undefined;

  const monthNote = notes.month_note?.trim();
  const noteSections = [
    { title: "Hal yang sudah dikuasai", body: notes.strengths?.trim() },
    { title: "Fokus pengembangan berikutnya", body: notes.improvements?.trim() },
    { title: "Dukungan belajar di rumah", body: notes.parent_advice?.trim() },
  ].filter((n) => n.body);

  const countCompare = compare(totals.monthCount, previous?.monthCount, "tugas");
  const avgCompare = compare(totals.monthAverage, previous?.monthAverage, "poin");
  const kpis = [
    {
      label: "Tugas dikerjakan",
      value: totals.monthCount,
      suffix: "tugas",
      hint: countCompare?.text ?? "Bulan ini",
      cls: "",
    },
    {
      label: "Rata-rata nilai",
      value: totals.monthAverage ?? "–",
      suffix: totals.monthAverage === null ? "" : "/ 100",
      hint: avgCompare?.text ?? (totals.monthAverage === null ? "Belum ada nilai bulan ini" : "Bulan ini"),
      cls: avgCompare?.cls ?? "",
    },
    hasNewData
      ? {
          label: "Materi selesai",
          value: snapshot.completedThisMonth ?? 0,
          suffix: "bulan ini",
          hint: `Total ${totals.completed} dari ${totals.total} materi`,
          cls: "",
        }
      : {
          label: "Progres keseluruhan",
          value: `${overallPct}%`,
          suffix: "",
          hint: `${totals.completed} dari ${totals.total} materi`,
          cls: "",
        },
    hasNewData
      ? {
          label: "Hari aktif",
          value: snapshot.activeDays ?? 0,
          suffix: "hari",
          hint:
            (snapshot.longestStreak ?? 0) > 1
              ? `Terpanjang ${snapshot.longestStreak} hari berturut-turut`
              : "Bulan ini",
          cls: "",
        }
      : {
          label: "Level",
          value: student.level,
          suffix: "",
          hint: `${student.xp.toLocaleString("id-ID")} XP`,
          cls: "",
        },
  ];

  return (
    <article className={styles.report}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={styles.brand}>
            Super<span>coder</span>
          </span>
          <span className={styles.kicker}>Rapor belajar bulanan</span>
        </div>
        <div>
          <h1 className={styles.name}>{student.name}</h1>
          <div className={styles.period}>{formatPeriod(snapshot.period)}</div>
        </div>
        <div className={styles.pills}>
          <span className={styles.pill}>
            Level {student.level} · {student.xp.toLocaleString("id-ID")} XP
          </span>
          <span className={styles.pill}>Progres total {overallPct}%</span>
        </div>
      </header>

      <section className={styles.kpis} aria-label="Ringkasan bulan ini">
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <span className={styles.kpiValue}>
              <span className={styles.kpiNumber}>{k.value}</span>
              {k.suffix && <span className={styles.kpiSuffix}>{k.suffix}</span>}
            </span>
            <span className={`${styles.kpiHint} ${k.cls}`}>{k.hint}</span>
          </div>
        ))}
      </section>

      {(monthNote || noteSections.length > 0) && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Catatan guru</h2>
          {monthNote && (
            <div className={styles.highlight}>
              <span className={styles.highlightLabel}>Kegiatan bulan ini</span>
              <p className={styles.noteBody}>{monthNote}</p>
            </div>
          )}
          {noteSections.map((n) => (
            <div key={n.title} className={styles.note}>
              <span className={styles.noteTitle}>{n.title}</span>
              <p className={styles.noteBody}>{n.body}</p>
            </div>
          ))}
        </section>
      )}

      {snapshot.sources && snapshot.sources.length > 0 && (
        <section className={styles.card}>
          <div>
            <h2 className={styles.cardTitle}>Nilai dari mana saja?</h2>
            <p className={styles.cardHint}>Rata-rata nilai bulan ini per jenis tugas</p>
          </div>
          {snapshot.sources.map((s) => {
            const isXp = s.avg === null && s.xp > 0;
            const meta = isXp
              ? `${s.passed} materi selesai`
              : [
                  `${s.lessons} materi`,
                  s.avg !== null && `${s.passed} lulus`,
                  s.pending > 0 && `${s.pending} menunggu dinilai`,
                ]
                  .filter(Boolean)
                  .join(" · ");
            return (
              <div key={s.type} className={styles.source}>
                <div className={styles.sourceMain}>
                  <div className={styles.sourceRow}>
                    <span className={styles.sourceLabel}>{s.label}</span>
                    <span className={styles.muted}>{meta}</span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={`${styles.fill} ${isXp ? styles.good : tone(s.avg)}`}
                      style={{ width: `${isXp ? 100 : (s.avg ?? 0)}%` }}
                    />
                  </div>
                </div>
                {isXp ? (
                  <span className={`${styles.badge} ${styles.good}`}>+{s.xp} XP</span>
                ) : (
                  <span className={`${styles.badge} ${tone(s.avg)}`}>{s.avg ?? "Menunggu"}</span>
                )}
              </div>
            );
          })}
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Progres per mata pelajaran</h2>
        {subjects.length === 0 ? (
          <p className={styles.empty}>Belum ada mata pelajaran yang dikerjakan.</p>
        ) : (
          <>
            {subjects.map((s) => {
              const before = s.completedBefore ?? s.completed;
              const pct = (n: number) => (s.total > 0 ? (n / s.total) * 100 : 0);
              const monthBits = [
                `${s.monthCount} tugas`,
                s.monthAverage !== null && `rata-rata ${s.monthAverage}`,
                (s.monthXp ?? 0) > 0 && `+${s.monthXp} XP dari guru`,
              ].filter(Boolean);
              return (
                <div key={s.title} className={styles.subject}>
                  <div className={styles.sourceRow}>
                    <span className={styles.subjectTitle}>{s.title}</span>
                    <span className={styles.muted}>
                      <strong>{s.completed}</strong> dari {s.total} materi selesai
                    </span>
                  </div>
                  <div className={`${styles.track} ${styles.trackLg}`}>
                    <div className={styles.fillBefore} style={{ width: `${pct(before)}%` }} />
                    <div className={styles.fillMonth} style={{ width: `${pct(s.completed - before)}%` }} />
                  </div>
                  <span className={styles.muted}>Bulan ini: {monthBits.join(" · ")}</span>
                </div>
              );
            })}
            {hasNewData && (
              <div className={styles.legend}>
                <span>
                  <i className={styles.fillBefore} /> Selesai sebelumnya
                </span>
                <span>
                  <i className={styles.fillMonth} /> Selesai bulan ini
                </span>
              </div>
            )}
          </>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.sourceRow}>
          <h2 className={styles.cardTitle}>Aktivitas bulan ini</h2>
          {activities.length > 0 && <span className={styles.muted}>{activities.length} tugas</span>}
        </div>
        {activities.length === 0 ? (
          <p className={styles.empty}>
            {monthNote
              ? "Tidak ada tugas LMS bulan ini. Lihat catatan Kegiatan bulan ini di atas."
              : "Tidak ada aktivitas tercatat pada bulan ini."}
          </p>
        ) : (
          <ul className={styles.activityList}>
            {activities.map((a, i) => (
              <li key={i} className={styles.activity}>
                <div className={styles.date}>
                  <span className={styles.dateDay}>{datePart(a.date, "day")}</span>
                  <span className={styles.dateMonth}>{datePart(a.date, "month")}</span>
                </div>
                <div className={styles.activityMain}>
                  <span className={styles.activityTitle}>{a.lesson}</span>
                  <span className={styles.muted}>
                    {a.subject} · {REPORT_SOURCE_LABELS[a.type] || a.type}
                  </span>
                  {a.feedback && <span className={styles.feedback}>Guru: “{a.feedback}”</span>}
                </div>
                <ActivityBadge a={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {achievements.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Pencapaian baru</h2>
          <div className={styles.badges}>
            {achievements.map((a) => (
              <div key={a.title + a.earnedAt} className={styles.achievement}>
                <Award size={22} aria-hidden="true" className={styles.achievementIcon} />
                <span>
                  <span className={styles.achievementTitle}>{a.title}</span>
                  {a.description && <span className={styles.achievementDesc}>{a.description}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        Nilai {PASS_SCORE} ke atas dihitung sebagai materi selesai. Nilai guru berupa XP (mis. +20 XP)
        berarti materi sudah selesai dan tidak dihitung dalam rata-rata.
      </footer>
    </article>
  );
}
