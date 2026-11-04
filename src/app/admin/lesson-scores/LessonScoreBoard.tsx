"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Search, Zap } from "lucide-react";
import { PROGRAMS } from "@/lib/student-access";
import { PASS_SCORE } from "@/lib/reports";
import { formatWita, scoreTone } from "@/lib/gradebook";
import { saveLessonXpReward, submitLessonScore } from "./actions";
import gb from "../gradebook/gradebook.module.css";
import styles from "./lesson-scores.module.css";

type Subject = { id: string; title: string };
type Module = {
  id: string;
  subject_id: string;
  title: string;
  order_index: number | null;
  programs: string[] | null;
};
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  order_index: number | null;
  xp_reward: number | null;
};
type Student = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  program: string | null;
};
export type LessonScore = {
  id: string;
  student_id: string;
  content_id: string;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  data: { xp_awarded?: number } | null;
};

type Status = "all" | "ungraded" | "passed" | "failed";

const PROGRAM_OPTIONS = [{ value: "", label: "Semua Program" }].concat(
  PROGRAMS.filter((p) => p.value !== "teaser"),
);

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Modul tanpa daftar program dianggap milik Supercoder (sama seperti di halaman lain).
const moduleInProgram = (m: Module, program: string) =>
  !program || (m.programs ?? ["supercoder"]).includes(program);

const errorText = (e: unknown) =>
  e instanceof Error && e.message ? e.message : "Gagal menyimpan. Coba lagi.";

export default function LessonScoreBoard({
  subjects,
  modules,
  lessons,
  students,
  scores,
  initial,
}: {
  subjects: Subject[];
  modules: Module[];
  lessons: Lesson[];
  students: Student[];
  scores: LessonScore[];
  initial: { subjectId: string; lessonId: string; program: string };
}) {
  const lessonSearchRef = useRef<HTMLInputElement>(null);
  const studentSearchRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [program, setProgram] = useState(
    PROGRAM_OPTIONS.some((p) => p.value === initial.program) ? initial.program : "",
  );
  const [subjectId, setSubjectId] = useState(
    subjects.some((s) => s.id === initial.subjectId) ? initial.subjectId : "",
  );
  const [lessonId, setLessonId] = useState(
    lessons.some((l) => l.id === initial.lessonId) ? initial.lessonId : "",
  );
  const [lessonQ, setLessonQ] = useState("");
  const [studentQ, setStudentQ] = useState("");
  const [status, setStatus] = useState<Status>("all");

  // Pilihan disimpan di URL agar halaman bisa dimuat ulang atau dibagikan tanpa kehilangan posisi.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (program) qs.set("program", program);
    if (subjectId) qs.set("subject_id", subjectId);
    if (lessonId) qs.set("lesson_id", lessonId);
    const query = qs.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [program, subjectId, lessonId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      (lessonId ? studentSearchRef : lessonSearchRef).current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lessonId]);

  const scopedStudents = useMemo(
    () => students.filter((s) => !program || s.program === program),
    [students, program],
  );
  const scopedIds = useMemo(() => new Set(scopedStudents.map((s) => s.id)), [scopedStudents]);

  const scoresByLesson = useMemo(() => {
    const map = new Map<string, Map<string, LessonScore>>();
    for (const s of scores) {
      if (!map.has(s.content_id)) map.set(s.content_id, new Map());
      map.get(s.content_id)!.set(s.student_id, s);
    }
    return map;
  }, [scores]);

  const gradedCount = (id: string) => {
    let n = 0;
    scoresByLesson.get(id)?.forEach((s) => {
      if (scopedIds.has(s.student_id)) n++;
    });
    return n;
  };

  const moduleById = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const lessonNeedle = lessonQ.trim().toLowerCase();
  const groups = subjects
    .filter((s) => !subjectId || s.id === subjectId)
    .map((subject) => ({
      subject,
      modules: modules
        .filter((m) => m.subject_id === subject.id && moduleInProgram(m, program))
        .map((module) => {
          const moduleHit =
            !lessonNeedle ||
            subject.title.toLowerCase().includes(lessonNeedle) ||
            module.title.toLowerCase().includes(lessonNeedle);
          return {
            module,
            lessons: lessons
              .filter(
                (l) =>
                  l.module_id === module.id &&
                  (moduleHit || l.title.toLowerCase().includes(lessonNeedle)),
              )
              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
          };
        })
        .filter((g) => g.lessons.length > 0),
    }))
    .filter((g) => g.modules.length > 0);
  const shownLessons = groups.reduce(
    (n, g) => n + g.modules.reduce((m, mg) => m + mg.lessons.length, 0),
    0,
  );

  const lesson = lessons.find((l) => l.id === lessonId);
  const lessonModule = lesson ? moduleById.get(lesson.module_id) : undefined;
  const lessonSubject = lessonModule ? subjectById.get(lessonModule.subject_id) : undefined;
  const lessonScores = scoresByLesson.get(lessonId) ?? new Map<string, LessonScore>();

  const scoreOf = (studentId: string) => lessonScores.get(studentId)?.score ?? null;
  const graded = scopedStudents.filter((s) => lessonScores.has(s.id));
  const gradedValues = graded.map((s) => scoreOf(s.id)).filter((v): v is number => v !== null);
  const avg = gradedValues.length
    ? Math.round(gradedValues.reduce((a, b) => a + b, 0) / gradedValues.length)
    : null;
  const passedCount = gradedValues.filter((v) => v >= PASS_SCORE).length;

  const matchesStatus: Record<Status, (s: Student) => boolean> = {
    all: () => true,
    ungraded: (s) => !lessonScores.has(s.id),
    passed: (s) => (scoreOf(s.id) ?? -1) >= PASS_SCORE,
    failed: (s) => lessonScores.has(s.id) && (scoreOf(s.id) ?? 0) < PASS_SCORE,
  };
  const counts = Object.fromEntries(
    (Object.keys(matchesStatus) as Status[]).map((k) => [
      k,
      scopedStudents.filter(matchesStatus[k]).length,
    ]),
  ) as Record<Status, number>;

  const studentNeedle = studentQ.trim().toLowerCase();
  const visibleStudents = scopedStudents
    .filter(matchesStatus[status])
    .filter(
      (s) =>
        !studentNeedle ||
        (s.full_name ?? "").toLowerCase().includes(studentNeedle) ||
        (s.username ?? "").toLowerCase().includes(studentNeedle) ||
        (s.email ?? "").toLowerCase().includes(studentNeedle),
    );

  const pickLesson = (id: string) => {
    setLessonId(id);
    setStatus("all");
    // Di layar sempit panel nilai ada di bawah daftar materi.
    if (window.matchMedia("(max-width: 960px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <div className={gb.page}>
      <div className={gb.header}>
        <div>
          <h1 className={gb.title}>Penilaian Materi</h1>
          <p className={gb.subtitle}>
            Nilai manual untuk tugas offline. Pilih materi di kiri, lalu isi nilai tiap siswa.
          </p>
        </div>
        <div className={gb.chips}>
          {PROGRAM_OPTIONS.map((p) => (
            <button
              key={p.value || "all"}
              type="button"
              aria-pressed={program === p.value}
              className={`${gb.chip} ${program === p.value ? gb.chipOn : ""}`}
              onClick={() => setProgram(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={`${gb.panel} ${styles.picker}`} aria-label="Pilih materi">
          <div className={styles.pickerHead}>
            <label className={gb.searchBox} style={{ flex: "none" }}>
              <span className="sr-only">Cari materi</span>
              <Search size={18} className={gb.searchIcon} aria-hidden="true" />
              <input
                ref={lessonSearchRef}
                type="search"
                className={gb.searchInput}
                value={lessonQ}
                onChange={(e) => setLessonQ(e.target.value)}
                placeholder="Cari materi, modul, atau mapel…"
              />
              {!lessonQ && !lessonId && (
                <span className={gb.kbd} aria-hidden="true">
                  /
                </span>
              )}
            </label>
            <select
              className={gb.select}
              aria-label="Mata pelajaran"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Semua mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.pickerList}>
            {groups.map(({ subject, modules: moduleGroups }) => (
              <div key={subject.id}>
                {!subjectId && <div className={styles.groupSubject}>{subject.title}</div>}
                {moduleGroups.map(({ module, lessons: moduleLessons }) => (
                  <div key={module.id} className={styles.group}>
                    <div className={styles.groupModule}>{module.title}</div>
                    {moduleLessons.map((l) => {
                      const n = gradedCount(l.id);
                      const on = l.id === lessonId;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          aria-current={on ? "true" : undefined}
                          className={`${styles.lessonBtn} ${on ? styles.lessonOn : ""}`}
                          onClick={() => pickLesson(l.id)}
                        >
                          <span className={styles.lessonTitle}>{l.title}</span>
                          <span className={styles.lessonMeta}>
                            {(l.xp_reward ?? 0) > 0 && (
                              <span title="Bobot XP">⚡{l.xp_reward}</span>
                            )}
                            {n > 0 && <span title="Siswa yang sudah dinilai">{n} dinilai</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
            {shownLessons === 0 && (
              <div className={gb.empty}>
                <span className={gb.strong}>Materi tidak ditemukan</span>
                <span className={gb.muted}>Coba kata kunci lain atau ganti mapel.</span>
              </div>
            )}
          </div>
          <div className={gb.footer}>{shownLessons} materi</div>
        </aside>

        <div ref={detailRef} className={styles.detail}>
          {!lesson ? (
            <div className={`${gb.panel} ${gb.empty}`}>
              <span className={gb.strong}>Belum ada materi yang dipilih</span>
              <span className={gb.muted}>
                Cari dan pilih materi di panel kiri untuk mulai menilai siswa.
              </span>
            </div>
          ) : (
            <>
              <div className={`${gb.panel} ${styles.lessonHead}`}>
                <div className={gb.stack}>
                  <span className={gb.muted}>
                    {lessonSubject?.title} › {lessonModule?.title}
                  </span>
                  <h2 className={styles.lessonName}>{lesson.title}</h2>
                </div>
                <XpRewardForm key={lesson.id} lesson={lesson} />
              </div>

              <div className={gb.kpis}>
                <div className={gb.kpi}>
                  <span className={gb.kpiLabel}>Sudah dinilai</span>
                  <span className={gb.kpiValue}>
                    <span className={gb.kpiNumber}>{graded.length}</span>
                    <span className={gb.kpiSuffix}>/ {scopedStudents.length} siswa</span>
                  </span>
                  <span className={gb.kpiHint}>{counts.ungraded} siswa belum dinilai</span>
                </div>
                <div className={gb.kpi}>
                  <span className={gb.kpiLabel}>Rata-rata nilai</span>
                  <span className={gb.kpiValue}>
                    <span className={gb.kpiNumber}>{avg ?? "–"}</span>
                    <span className={gb.kpiSuffix}>dari 100</span>
                  </span>
                  <span className={gb.kpiHint}>Dari siswa yang sudah dinilai</span>
                </div>
                <div className={gb.kpi}>
                  <span className={gb.kpiLabel}>Lulus</span>
                  <span className={gb.kpiValue}>
                    <span className={gb.kpiNumber}>{passedCount}</span>
                    <span className={gb.kpiSuffix}>siswa</span>
                  </span>
                  <span className={gb.kpiHint}>Nilai ≥ {PASS_SCORE}</span>
                </div>
              </div>

              <div className={`${gb.panel} ${styles.studentToolbar}`}>
                <label className={gb.searchBox}>
                  <span className="sr-only">Cari siswa</span>
                  <Search size={18} className={gb.searchIcon} aria-hidden="true" />
                  <input
                    ref={studentSearchRef}
                    type="search"
                    className={gb.searchInput}
                    value={studentQ}
                    onChange={(e) => setStudentQ(e.target.value)}
                    placeholder="Cari nama, username, atau email…"
                  />
                  {!studentQ && (
                    <span className={gb.kbd} aria-hidden="true">
                      /
                    </span>
                  )}
                </label>
                <div className={gb.chips}>
                  {(
                    [
                      ["all", "Semua"],
                      ["ungraded", "Belum dinilai"],
                      ["passed", "Lulus"],
                      ["failed", "Belum lulus"],
                    ] as [Status, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={status === key}
                      className={`${gb.chip} ${status === key ? gb.chipOn : ""}`}
                      onClick={() => setStatus(key)}
                    >
                      {label} <span className={gb.chipCount}>{counts[key]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={gb.panel} style={{ overflow: "hidden" }}>
                <div className={`${styles.listHead} ${styles.rowGrid}`} aria-hidden="true">
                  <span>Siswa</span>
                  <span>Nilai saat ini</span>
                  <span>Nilai baru &amp; komentar</span>
                </div>
                {visibleStudents.map((s) => {
                  const sub = lessonScores.get(s.id);
                  return (
                    <StudentScoreRow
                      key={`${lesson.id}-${s.id}`}
                      lessonId={lesson.id}
                      student={s}
                      sub={sub}
                    />
                  );
                })}
                {visibleStudents.length === 0 && (
                  <div className={gb.empty}>
                    <span className={gb.strong}>Tidak ada siswa yang cocok</span>
                    <span className={gb.muted}>Coba kata kunci lain atau ubah filter.</span>
                  </div>
                )}
                <div className={gb.footer}>
                  <span>
                    Menampilkan {visibleStudents.length} dari {scopedStudents.length} siswa
                  </span>
                  <span className={gb.legend}>
                    <span>
                      <span className={`${gb.legendTag} ${gb.good}`}>≥70</span> Lulus
                    </span>
                    <span>
                      <span className={`${gb.legendTag} ${gb.warn}`}>50–69</span> Perlu ulang
                    </span>
                    <span>
                      <span className={`${gb.legendTag} ${gb.bad}`}>&lt;50</span> Kesulitan
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`${gb.btnMain} ${styles.saveBtn}`} disabled={pending}>
      {pending ? "Menyimpan…" : label}
    </button>
  );
}

function XpRewardForm({ lesson }: { lesson: Lesson }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const action = async (formData: FormData) => {
    setMsg(null);
    try {
      await saveLessonXpReward(formData);
      setMsg({ ok: true, text: "Bobot tersimpan" });
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    }
  };

  return (
    <form action={action} className={styles.xpForm}>
      <input type="hidden" name="lessonId" value={lesson.id} />
      <label className={styles.xpLabel}>
        <Zap size={16} aria-hidden="true" />
        Bobot XP
        <input
          type="number"
          name="xpReward"
          min="0"
          defaultValue={lesson.xp_reward ?? 0}
          required
          className={`${styles.input} ${styles.scoreInput}`}
        />
      </label>
      <SaveButton label="Simpan Bobot" />
      <span className={styles.xpHint}>
        {msg ? (
          <span className={msg.ok ? styles.ok : styles.fail}>{msg.text}</span>
        ) : (
          <>
            Didapat sekali saat nilai ≥ {PASS_SCORE}. Siswa yang sudah lulus langsung
            mendapat XP saat bobot disimpan.
          </>
        )}
      </span>
    </form>
  );
}

function StudentScoreRow({
  lessonId,
  student,
  sub,
}: {
  lessonId: string;
  student: Student;
  sub: LessonScore | undefined;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const name = student.full_name || "Tanpa Nama";
  const programLabel = PROGRAMS.find((p) => p.value === student.program)?.label;

  const action = async (formData: FormData) => {
    setMsg(null);
    try {
      await submitLessonScore(formData);
      setMsg({ ok: true, text: "Tersimpan" });
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    }
  };

  return (
    <div className={`${styles.row} ${styles.rowGrid}`}>
      <span className={gb.student}>
        <span className={gb.avatar} aria-hidden="true">
          {initials(name)}
        </span>
        <span className={gb.stack}>
          <span className={`${gb.strong} ${gb.ellipsis}`}>{name}</span>
          <span className={gb.meta}>
            <span className={gb.ellipsis}>
              {student.username ? `@${student.username}` : student.email}
            </span>
            {programLabel && <span className={gb.programTag}>{programLabel}</span>}
          </span>
        </span>
      </span>

      <span className={gb.lastLesson}>
        {sub ? (
          <>
            <span className={`${gb.score} ${gb[scoreTone(sub.score)]}`}>{sub.score ?? "–"}</span>
            <span className={gb.stack}>
              {sub.graded_at && <span className={gb.muted}>{formatWita(sub.graded_at)}</span>}
              {sub.data?.xp_awarded ? (
                <span className={styles.xpTag}>+{sub.data.xp_awarded} XP</span>
              ) : null}
            </span>
          </>
        ) : (
          <span className={gb.muted}>Belum dinilai</span>
        )}
      </span>

      <form action={action} className={styles.rowForm}>
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="studentId" value={student.id} />
        <input
          type="number"
          name="score"
          placeholder="0–100"
          aria-label={`Nilai ${name} (0–100)`}
          min="0"
          max="100"
          defaultValue={sub?.score ?? ""}
          required
          className={`${styles.input} ${styles.scoreInput}`}
        />
        <input
          type="text"
          name="feedback"
          placeholder="Komentar (opsional)"
          aria-label={`Komentar untuk ${name}`}
          defaultValue={sub?.feedback ?? ""}
          className={`${styles.input} ${styles.feedbackInput}`}
        />
        <SaveButton label="Simpan" />
        {msg && (
          <span className={`${styles.rowMsg} ${msg.ok ? styles.ok : styles.fail}`} role="status">
            {msg.ok && <Check size={14} aria-hidden="true" />}
            {msg.text}
          </span>
        )}
      </form>
    </div>
  );
}
