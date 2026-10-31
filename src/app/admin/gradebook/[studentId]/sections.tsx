import { PASS_SCORE } from "@/lib/reports";
import { formatWita, scoreTone, type ProfileLesson, type StudentProfile } from "@/lib/gradebook";
import styles from "../gradebook.module.css";

const SOURCE_COLORS: Record<string, string> = {
  code: "#2563eb",
  quiz: "#7c3aed",
  css: "#db2777",
  web: "#0891b2",
  lesson: "#ea580c",
  project: "#475569",
};

const LESSON_TYPES: Record<string, string> = {
  video: "Video",
  quiz: "Kuis",
  code: "Coding",
  css: "CSS",
  html: "HTML",
  project: "Project",
  "web-challenge": "Web",
};

function Score({ value, small }: { value: number | null; small?: boolean }) {
  return (
    <span className={`${styles.score} ${small ? styles.scoreSm : ""} ${styles[scoreTone(value)]}`}>
      {value ?? "–"}
    </span>
  );
}

// Nilai guru pada materi tanpa bobot XP adalah jumlah XP, artinya materi sudah selesai.
function XpBadge({ xp }: { xp: number }) {
  return (
    <span className={`${styles.score} ${styles.scoreSm} ${styles.good}`} title="Nilai guru berupa XP">
      +{xp} XP
    </span>
  );
}

export function ScoreSources({ sources }: { sources: StudentProfile["sources"] }) {
  return (
    <section className={`${styles.panel} ${styles.section} ${styles.splitMain}`}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Nilai dari mana saja?</h2>
        <span className={styles.sectionHint}>Nilai tertinggi per materi, dikelompokkan per sumber</span>
      </div>
      <div className={styles.sources}>
        <span className={styles.colHead}>Sumber</span>
        <span className={styles.colHead}>Rata-rata</span>
        <span className={styles.colHead} style={{ textAlign: "right" }}>
          Materi
        </span>
        <span className={styles.colHead} style={{ textAlign: "right" }}>
          Lulus
        </span>
        {sources.map((s) => (
          <div key={s.type} style={{ display: "contents" }}>
            <span className={styles.sourceName}>
              <span className={styles.swatch} style={{ background: SOURCE_COLORS[s.type] }} />
              {s.label}
            </span>
            <span className={styles.sourceBar}>
              <span className={styles.sourceTrack}>
                <span
                  className={styles.fill}
                  style={{ width: `${s.avg ?? 0}%`, background: SOURCE_COLORS[s.type] }}
                />
              </span>
              <span style={{ fontWeight: 800, width: 32, textAlign: "right", fontSize: "0.875rem" }}>
                {s.avg ?? "–"}
              </span>
            </span>
            {s.xp > 0 && (
              <span className={styles.muted} style={{ gridColumn: "2 / -1", marginTop: -10 }}>
                {s.xpLessons} materi dinilai guru dalam bentuk XP (total +{s.xp} XP): dihitung lulus,
                tidak masuk rata-rata
              </span>
            )}
            <span className={styles.sourceNum}>{s.lessons}</span>
            <span className={styles.sourceNum}>{s.lessons ? `${s.passed}/${s.lessons}` : "–"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RetryList({ retry }: { retry: StudentProfile["retry"] }) {
  return (
    <section className={`${styles.panel} ${styles.section} ${styles.splitSide}`}>
      <div className={styles.stack} style={{ gap: 4 }}>
        <h2 className={styles.sectionTitle}>Perlu diulang</h2>
        <span className={styles.sectionHint}>
          Sudah dicoba, nilai tertinggi masih di bawah {PASS_SCORE}
        </span>
      </div>
      {retry.length === 0 && (
        <span className={styles.muted} style={{ fontSize: "0.8125rem" }}>
          Tidak ada. Semua materi yang dicoba sudah lulus.
        </span>
      )}
      {retry.slice(0, 6).map((m) => (
        <div key={m.id} className={styles.retryItem}>
          <Score value={m.score} />
          <span className={styles.stack}>
            <span className={styles.strong}>{m.title}</span>
            <span className={styles.muted}>
              {m.subject} · {m.attempts} percobaan · terakhir {formatWita(m.lastAt, false)}
            </span>
          </span>
        </div>
      ))}
      {retry.length > 6 && <span className={styles.muted}>+{retry.length - 6} materi lainnya</span>}
    </section>
  );
}

export function ActivityTimeline({ timeline }: { timeline: StudentProfile["timeline"] }) {
  return (
    <section className={`${styles.panel} ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Aktivitas terbaru</h2>
        <span className={styles.sectionHint}>Setiap percobaan tercatat, terbaru di atas</span>
      </div>
      {timeline.length === 0 ? (
        <span className={styles.muted} style={{ fontSize: "0.8125rem" }}>
          Belum ada aktivitas.
        </span>
      ) : (
        <div className={styles.tableScroll}>
          <div className={styles.timeline} role="table" aria-label="Aktivitas terbaru">
            <div className={`${styles.timelineRow} ${styles.timelineHead} ${styles.colHead}`} role="row">
              <span role="columnheader">Waktu</span>
              <span role="columnheader">Materi</span>
              <span role="columnheader">Mapel</span>
              <span role="columnheader">Sumber</span>
              <span role="columnheader">Nilai</span>
              <span role="columnheader">Percobaan</span>
              <span role="columnheader">Feedback guru</span>
            </div>
            {timeline.map((t, i) => (
              <div key={i} className={styles.timelineRow} role="row">
                <span role="cell" style={{ color: "#475569" }}>
                  {formatWita(t.at)}
                </span>
                <span role="cell" className={styles.strong} style={{ fontSize: "0.8125rem" }}>
                  {t.lesson}
                </span>
                <span role="cell" style={{ color: "#475569" }}>
                  {t.subject}
                </span>
                <span role="cell">
                  <span className={styles.tag}>{t.source}</span>
                </span>
                <span role="cell">
                  {t.xp !== null ? (
                    <XpBadge xp={t.xp} />
                  ) : t.score === null ? (
                    <span className={styles.muted}>Menunggu</span>
                  ) : (
                    <Score value={t.score} small />
                  )}
                </span>
                <span role="cell" style={{ color: "#475569" }}>
                  ke-{t.attempt}
                </span>
                <span role="cell" className={styles.feedback}>
                  {t.feedback || "–"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function SubjectProgress({ subjects }: { subjects: StudentProfile["subjects"] }) {
  const squareClass = (l: ProfileLesson) =>
    l.passed ? styles.sqGood : l.score !== null ? styles.sqWarn : styles.sqNone;
  const lessonResult = (l: ProfileLesson) =>
    l.passed && l.score === null && l.xp !== null
      ? `selesai, +${l.xp} XP`
      : l.score !== null
        ? `nilai ${l.score}`
        : "belum dikerjakan";

  return (
    <section className={`${styles.panel} ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Progres per mata pelajaran</h2>
        <span className={styles.legend} style={{ fontSize: "0.75rem", color: "#475569" }}>
          <span className={styles.legend} style={{ gap: 6 }}>
            <span className={`${styles.sq} ${styles.sqGood}`} style={{ width: 12, height: 12 }} />
            Lulus ≥ {PASS_SCORE}
          </span>
          <span className={styles.legend} style={{ gap: 6 }}>
            <span className={`${styles.sq} ${styles.sqWarn}`} style={{ width: 12, height: 12 }} />
            Dicoba, belum lulus
          </span>
          <span className={styles.legend} style={{ gap: 6 }}>
            <span className={`${styles.sq} ${styles.sqNone}`} style={{ width: 12, height: 12 }} />
            Belum dikerjakan
          </span>
        </span>
      </div>
      {subjects.length === 0 && (
        <span className={styles.muted} style={{ fontSize: "0.8125rem" }}>
          Belum ada materi untuk program siswa ini.
        </span>
      )}
      <div className={styles.subjects}>
        {subjects.map((sub) => (
          <div key={sub.id} className={styles.subjectCard}>
            <div className={styles.sectionHead}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{sub.title}</span>
              <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                <strong style={{ color: "var(--secondary)" }}>{sub.pct}%</strong> · {sub.done}/{sub.total}{" "}
                materi
              </span>
            </div>
            <span className={`${styles.track} ${styles.trackLg}`}>
              <span
                className={`${styles.fill} ${sub.pct === 100 ? styles.fillFull : ""}`}
                style={{ width: `${sub.pct}%` }}
              />
            </span>
            <div className={styles.stack} style={{ gap: 10 }}>
              {sub.modules.map((mod) => {
                const passed = mod.lessons.filter((l) => l.passed).length;
                return (
                  <div key={mod.id} className={styles.moduleRow}>
                    <span className={styles.ellipsis} style={{ fontSize: "0.8125rem", color: "#334155" }}>
                      {mod.title}
                    </span>
                    <span
                      className={styles.squares}
                      role="img"
                      aria-label={`${mod.title}: ${passed} dari ${mod.lessons.length} materi lulus`}
                    >
                      {mod.lessons.map((l) => (
                        <span
                          key={l.id}
                          className={`${styles.sq} ${squareClass(l)}`}
                          title={`${l.title}: ${lessonResult(l)}`}
                        />
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
            <details className={styles.details}>
              <summary>Lihat semua materi &amp; nilai</summary>
              <div className={styles.lessonList}>
                {sub.modules.map((mod) => (
                  <div key={mod.id} className={styles.stack} style={{ gap: 6 }}>
                    <span className={styles.lessonModule}>{mod.title}</span>
                    {mod.lessons.map((l) => (
                      <div key={l.id} className={styles.lessonItem}>
                        <span className={styles.stack}>
                          <span style={{ fontWeight: 600 }}>{l.title}</span>
                          <span className={styles.muted}>
                            {LESSON_TYPES[l.type] ?? l.type}
                            {l.attempts > 0 && ` · ${l.attempts} percobaan`}
                          </span>
                        </span>
                        {l.score !== null ? (
                          <Score value={l.score} small />
                        ) : l.xp !== null ? (
                          <XpBadge xp={l.xp} />
                        ) : (
                          <span className={styles.muted}>
                            {l.attempts > 0 ? "Menunggu nilai" : "Belum dikerjakan"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
