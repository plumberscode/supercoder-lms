"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Search } from "lucide-react";
import { PROGRAMS } from "@/lib/student-access";
import {
  INACTIVE_DAYS,
  formatWita,
  relativeTime,
  scoreTone,
  type GbSubject,
  type GradebookRow,
} from "@/lib/gradebook";
import styles from "./gradebook.module.css";

type Status = "all" | "active" | "inactive" | "attention";
type SortKey = "name" | "active" | "progress" | "avg";
type Sort = { key: SortKey; dir: 1 | -1 };

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SORT: Sort = { key: "active", dir: -1 };
const PROGRAM_OPTIONS = [{ value: "", label: "Semua Program" }].concat(
  PROGRAMS.filter((p) => p.value !== "teaser"),
);

function parseSort(value: string): Sort {
  const [key, dir] = value.split(":");
  if (!["name", "active", "progress", "avg"].includes(key)) return DEFAULT_SORT;
  return { key: key as SortKey, dir: dir === "asc" ? 1 : -1 };
}

function sortValue(row: GradebookRow, key: SortKey) {
  if (key === "name") return row.name.toLowerCase();
  if (key === "active") return row.lastActivityAt ? Date.parse(row.lastActivityAt) : 0;
  if (key === "progress") return row.pct;
  return row.avg30 ?? -1;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function StudentTable({
  rows,
  subjects,
  subjectId,
  now,
  initial,
}: {
  rows: GradebookRow[];
  subjects: GbSubject[];
  subjectId: string;
  now: string;
  initial: { q: string; program: string; status: string; sort: string };
}) {
  const router = useRouter();
  const nowDate = useMemo(() => new Date(now), [now]);
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(initial.q);
  const [program, setProgram] = useState(
    PROGRAM_OPTIONS.some((p) => p.value === initial.program) ? initial.program : "",
  );
  const [status, setStatus] = useState<Status>(
    (["all", "active", "inactive", "attention"] as const).find((s) => s === initial.status) ?? "all",
  );
  const [sort, setSort] = useState<Sort>(parseSort(initial.sort));

  // Filter disimpan di URL agar tombol Kembali dari profil siswa mengembalikan tampilan yang sama.
  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (subjectId) qs.set("subject_id", subjectId);
    if (program) qs.set("program", program);
    if (status !== "all") qs.set("status", status);
    if (q.trim()) qs.set("q", q.trim());
    if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
      qs.set("sort", `${sort.key}:${sort.dir === 1 ? "asc" : "desc"}`);
    }
    return qs.toString();
  }, [subjectId, program, status, q, sort]);

  useEffect(() => {
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const inactiveSince = nowDate.getTime() - INACTIVE_DAYS * DAY_MS;
  const isActive = (r: GradebookRow) =>
    !!r.lastActivityAt && Date.parse(r.lastActivityAt) >= inactiveSince;

  const byProgram = rows.filter((r) => !program || r.program === program);
  const counts: Record<Status, number> = {
    all: byProgram.length,
    active: byProgram.filter(isActive).length,
    inactive: byProgram.filter((r) => !isActive(r)).length,
    attention: byProgram.filter((r) => r.attention).length,
  };
  const matchesStatus: Record<Status, (r: GradebookRow) => boolean> = {
    all: () => true,
    active: isActive,
    inactive: (r) => !isActive(r),
    attention: (r) => !!r.attention,
  };

  const needle = q.trim().toLowerCase();
  const visible = byProgram
    .filter(matchesStatus[status])
    .filter(
      (r) =>
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        (r.username ?? "").toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle),
    )
    .sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
      return cmp * sort.dir || a.name.localeCompare(b.name);
    });

  const avgNow = average(byProgram.map((r) => r.avg30));
  const avgPrev = average(byProgram.map((r) => r.avgPrev30));
  const avgDelta = avgNow !== null && avgPrev !== null ? avgNow - avgPrev : null;
  const passedThisWeek = byProgram.reduce((n, r) => n + r.passedThisWeek, 0);

  const toggleStatus = (s: Status) => setStatus((cur) => (cur === s ? "all" : s));
  const sortBy = (key: SortKey) =>
    setSort((cur) => ({ key, dir: cur.key === key ? (-cur.dir as 1 | -1) : key === "name" ? 1 : -1 }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : "");
  const ariaSort = (key: SortKey) =>
    sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none";

  const changeSubject = (value: string) => {
    const qs = new URLSearchParams(query);
    if (value) qs.set("subject_id", value);
    else qs.delete("subject_id");
    router.push(`/admin/gradebook${qs.toString() ? `?${qs}` : ""}`);
  };

  const detailHref = (id: string) =>
    `/admin/gradebook/${id}${query ? `?back=${encodeURIComponent(query)}` : ""}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Buku Nilai</h1>
          <p className={styles.subtitle}>
            Perkembangan semua siswa dalam satu layar. Klik baris siswa untuk melihat detail lengkap.
          </p>
        </div>
        <div className={styles.chips}>
          {PROGRAM_OPTIONS.map((p) => (
            <button
              key={p.value || "all"}
              type="button"
              aria-pressed={program === p.value}
              className={`${styles.chip} ${program === p.value ? styles.chipOn : ""}`}
              onClick={() => setProgram(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.kpis}>
        <button
          type="button"
          aria-pressed={status === "active"}
          className={`${styles.kpi} ${status === "active" ? styles.kpiOn : ""}`}
          onClick={() => toggleStatus("active")}
        >
          <span className={styles.kpiLabel}>Aktif {INACTIVE_DAYS} hari terakhir</span>
          <span className={styles.kpiValue}>
            <span className={styles.kpiNumber}>{counts.active}</span>
            <span className={styles.kpiSuffix}>/ {counts.all} siswa</span>
          </span>
          <span className={styles.kpiHint}>Mengerjakan minimal 1 materi</span>
        </button>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Rata-rata nilai 30 hari</span>
          <span className={styles.kpiValue}>
            <span className={styles.kpiNumber}>{avgNow ?? "–"}</span>
            <span className={styles.kpiSuffix}>dari 100</span>
          </span>
          <span className={styles.kpiHint}>
            {avgDelta === null
              ? "Belum ada pembanding 30 hari sebelumnya"
              : avgDelta === 0
                ? "Sama dengan 30 hari sebelumnya"
                : `${avgDelta > 0 ? "↑" : "↓"} ${Math.abs(avgDelta)} poin dibanding 30 hari sebelumnya`}
          </span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Materi lulus 7 hari</span>
          <span className={styles.kpiValue}>
            <span className={styles.kpiNumber}>{passedThisWeek}</span>
            <span className={styles.kpiSuffix}>materi</span>
          </span>
          <span className={styles.kpiHint}>Pertama kali mencapai nilai ≥ 70</span>
        </div>
        <button
          type="button"
          aria-pressed={status === "attention"}
          className={`${styles.kpi} ${status === "attention" ? styles.kpiOn : ""}`}
          onClick={() => toggleStatus("attention")}
        >
          <span className={styles.kpiLabel}>Perlu perhatian</span>
          <span className={styles.kpiValue}>
            <span className={`${styles.kpiNumber} ${styles.kpiWarn}`}>{counts.attention}</span>
            <span className={styles.kpiSuffix}>siswa</span>
          </span>
          <span className={styles.kpiHint}>Tidak aktif, nilai rendah, atau banyak yang belum lulus</span>
        </button>
      </div>

      <div className={`${styles.panel} ${styles.toolbar}`}>
        <label className={styles.searchBox}>
          <span className="sr-only">Cari siswa</span>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, username, atau email…"
          />
          {!q && (
            <span className={styles.kbd} aria-hidden="true">
              /
            </span>
          )}
        </label>
        <label className={styles.selectLabel}>
          Mapel
          <select
            className={styles.select}
            value={subjectId}
            onChange={(e) => changeSubject(e.target.value)}
          >
            <option value="">Semua mapel</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.chips}>
          {(
            [
              ["all", "Semua"],
              ["active", `Aktif ${INACTIVE_DAYS} hari`],
              ["inactive", `Tidak aktif ≥ ${INACTIVE_DAYS} hari`],
              ["attention", "Perlu perhatian"],
            ] as [Status, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={status === key}
              className={`${styles.chip} ${status === key ? styles.chipOn : ""}`}
              onClick={() => setStatus(key)}
            >
              {label} <span className={styles.chipCount}>{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.panel} style={{ overflow: "hidden" }}>
        <div className={styles.tableScroll}>
          <div className={styles.table} role="table" aria-label="Daftar siswa">
            <div className={styles.tableHead} role="row">
              <span role="columnheader" aria-sort={ariaSort("name")}>
                <button type="button" className={styles.sortBtn} onClick={() => sortBy("name")}>
                  Siswa{arrow("name")}
                </button>
              </span>
              <span role="columnheader" aria-sort={ariaSort("active")}>
                <button type="button" className={styles.sortBtn} onClick={() => sortBy("active")}>
                  Terakhir aktif{arrow("active")}
                </button>
              </span>
              <span role="columnheader">Materi terakhir &amp; nilai</span>
              <span role="columnheader" aria-sort={ariaSort("progress")}>
                <button type="button" className={styles.sortBtn} onClick={() => sortBy("progress")}>
                  Progres{arrow("progress")}
                </button>
              </span>
              <span role="columnheader" aria-sort={ariaSort("avg")}>
                <button type="button" className={styles.sortBtn} onClick={() => sortBy("avg")}>
                  Rata-rata 30h{arrow("avg")}
                </button>
              </span>
              <span role="columnheader">Aktivitas 8 mgg</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                XP
              </span>
            </div>

            {visible.map((r) => (
              <StudentRow key={r.id} row={r} href={detailHref(r.id)} now={nowDate} active={isActive(r)} />
            ))}

            {visible.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.strong}>Tidak ada siswa yang cocok</span>
                <span className={styles.muted}>Coba kata kunci lain atau ubah filter.</span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <span>
            Menampilkan {visible.length} dari {byProgram.length} siswa
            {subjectId && " · progres & nilai dihitung untuk mapel terpilih"}
          </span>
          <span className={styles.legend}>
            <span>
              <span className={`${styles.legendTag} ${styles.good}`}>≥70</span> Lulus
            </span>
            <span>
              <span className={`${styles.legendTag} ${styles.warn}`}>50–69</span> Perlu ulang
            </span>
            <span>
              <span className={`${styles.legendTag} ${styles.bad}`}>&lt;50</span> Kesulitan
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StudentRow({
  row: r,
  href,
  now,
  active,
}: {
  row: GradebookRow;
  href: string;
  now: Date;
  active: boolean;
}) {
  const max = Math.max(1, ...r.weekly);
  const delta = r.avg30 !== null && r.avgPrev30 !== null ? r.avg30 - r.avgPrev30 : null;

  return (
    <Link href={href} className={styles.tableRow} role="row">
      <span className={styles.student} role="cell">
        <span className={styles.avatar} aria-hidden="true">
          {initials(r.name)}
        </span>
        <span className={styles.stack}>
          <span className={`${styles.strong} ${styles.ellipsis}`}>{r.name}</span>
          <span className={styles.meta}>
            <span className={styles.ellipsis}>{r.username ? `@${r.username}` : r.email}</span>
            <span className={styles.programTag}>
              {PROGRAMS.find((p) => p.value === r.program)?.label ?? r.program}
            </span>
          </span>
          {r.attention && (
            <span className={styles.attention}>
              <AlertTriangle size={12} aria-hidden="true" />
              {r.attention}
            </span>
          )}
        </span>
      </span>

      <span className={styles.stack} role="cell">
        <span className={active ? styles.fresh : styles.stale}>
          {relativeTime(r.lastActivityAt, now)}
        </span>
        {r.lastActivityAt && <span className={styles.muted}>{formatWita(r.lastActivityAt)}</span>}
      </span>

      <span className={styles.lastLesson} role="cell">
        {r.lastLesson ? (
          <>
            {r.lastLesson.xp !== null ? (
              <span className={`${styles.score} ${styles.good}`} title="Nilai guru berupa XP">
                +{r.lastLesson.xp} XP
              </span>
            ) : (
              <span className={`${styles.score} ${styles[scoreTone(r.lastLesson.score)]}`}>
                {r.lastLesson.score ?? "–"}
              </span>
            )}
            <span className={styles.stack}>
              <span className={`${styles.strong} ${styles.ellipsis}`} style={{ fontSize: "0.8125rem" }}>
                {r.lastLesson.title}
              </span>
              <span className={`${styles.muted} ${styles.ellipsis}`}>
                {r.lastLesson.source} · {r.lastLesson.subject}
              </span>
            </span>
          </>
        ) : (
          <span className={styles.muted}>Belum ada aktivitas</span>
        )}
      </span>

      <span className={styles.progress} role="cell">
        <span className={styles.progressText}>
          <strong style={{ color: "var(--secondary)" }}>{r.pct}%</strong>
          <span>
            {r.done}/{r.total} materi
          </span>
        </span>
        <span className={styles.track}>
          <span
            className={`${styles.fill} ${r.pct === 100 ? styles.fillFull : ""}`}
            style={{ width: `${r.pct}%` }}
          />
        </span>
      </span>

      <span className={styles.avg} role="cell">
        <span className={styles.avgNumber}>{r.avg30 ?? "–"}</span>
        {delta !== null && (
          <span className={delta > 0 ? styles.up : delta < 0 ? styles.down : styles.flat}>
            {delta > 0 ? `↑ ${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : "–"}
          </span>
        )}
      </span>

      <span
        className={styles.spark}
        role="cell"
        aria-label={`Jumlah pengerjaan per minggu, 8 minggu terakhir: ${r.weekly.join(", ")}`}
      >
        {r.weekly.map((v, i) => (
          <span
            key={i}
            className={`${styles.sparkBar} ${i === r.weekly.length - 1 ? styles.sparkBarNow : ""}`}
            style={{ height: `${Math.max(3, Math.round((v / max) * 28))}px` }}
          />
        ))}
      </span>

      <span className={styles.xp} role="cell">
        <span className={styles.strong}>{r.xp.toLocaleString("id-ID")}</span>
        <span className={styles.muted}>Lv {r.level}</span>
      </span>
    </Link>
  );
}
