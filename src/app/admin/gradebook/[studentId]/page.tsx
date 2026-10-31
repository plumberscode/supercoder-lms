import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, MessageCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { fetchCatalog, fetchSubmissions } from "@/lib/gradebook-data";
import { INACTIVE_DAYS, buildStudentProfile, formatWita, relativeTime } from "@/lib/gradebook";
import { PROGRAMS } from "@/lib/student-access";
import { buildWaLink } from "@/lib/whatsapp";
import { ActivityTimeline, RetryList, ScoreSources, SubjectProgress } from "./sections";
import styles from "../gradebook.module.css";

export default async function StudentGradebookPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { studentId } = await params;
  const { back } = await searchParams;
  const supabase = await createClient();

  const [studentRes, catalog, submissions] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, email, role, program, xp, level, created_at, parent_name, parent_whatsapp")
      .eq("id", studentId)
      .maybeSingle(),
    fetchCatalog(supabase),
    fetchSubmissions(supabase, studentId),
  ]);
  const student = studentRes.data;
  if (!student || student.role !== "student") notFound();

  const now = new Date();
  const profile = buildStudentProfile({
    ...catalog,
    program: student.program,
    submissions,
    now,
  });

  const name = student.full_name || "Tanpa Nama";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const lastAt = profile.lastActivity ? Date.parse(profile.lastActivity.at) : null;
  const active = lastAt !== null && now.getTime() - lastAt < INACTIVE_DAYS * 24 * 60 * 60 * 1000;
  const avgDelta =
    profile.avg30 !== null && profile.avgPrev30 !== null ? profile.avg30 - profile.avgPrev30 : null;
  const backHref = `/admin/gradebook${back ? `?${back}` : ""}`;

  const kpis = [
    {
      label: "Progres keseluruhan",
      value: `${profile.pct}%`,
      suffix: "",
      hint: `${profile.done} dari ${profile.total} materi lulus`,
    },
    {
      label: "Rata-rata nilai",
      value: profile.avg ?? "–",
      suffix: "/ 100",
      hint:
        avgDelta === null
          ? `30 hari terakhir: ${profile.avg30 ?? "–"}`
          : `30 hari terakhir: ${profile.avg30} (${avgDelta >= 0 ? "↑" : "↓"} ${Math.abs(avgDelta)})`,
      hintClass: avgDelta === null ? "" : avgDelta >= 0 ? styles.up : styles.down,
    },
    {
      label: "Materi lulus",
      value: profile.done,
      suffix: "materi",
      hint: `${profile.passedThisWeek} lulus dalam 7 hari terakhir`,
    },
    {
      label: "Total percobaan",
      value: profile.attempts,
      suffix: "kali",
      hint:
        profile.lessonsAttempted > 0
          ? `Rata-rata ${(profile.attempts / profile.lessonsAttempted).toLocaleString("id-ID", { maximumFractionDigits: 1 })} per materi`
          : "Belum ada percobaan",
    },
    {
      label: "Hari aktif bulan ini",
      value: profile.activeDaysThisMonth,
      suffix: "hari",
      hint:
        profile.longestStreakThisMonth > 1
          ? `Terpanjang ${profile.longestStreakThisMonth} hari berturut-turut`
          : "Zona waktu WITA",
    },
  ];

  return (
    <div className={styles.page}>
      <Link href={backHref} className={styles.back}>
        <ChevronLeft size={16} aria-hidden="true" />
        Buku Nilai
      </Link>

      <div className={`${styles.panel} ${styles.profileHead}`}>
        <div className={styles.identity}>
          <span className={styles.avatarLg} aria-hidden="true">
            {initials}
          </span>
          <div className={styles.stack} style={{ gap: 6 }}>
            <h1 className={styles.title} style={{ fontSize: "1.625rem" }}>
              {name}
            </h1>
            <div className={styles.identityMeta}>
              <span>{student.username ? `@${student.username}` : student.email}</span>
              <span aria-hidden="true">·</span>
              <span className={styles.programTag} style={{ fontSize: "0.75rem" }}>
                {PROGRAMS.find((p) => p.value === student.program)?.label ?? student.program}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Lv {student.level ?? 1} · {(student.xp ?? 0).toLocaleString("id-ID")} XP
              </span>
              <span aria-hidden="true">·</span>
              <span>Bergabung {formatWita(student.created_at, false)}</span>
            </div>
            <div className={styles.activeNow} style={{ color: active ? "#15803d" : "#b91c1c" }}>
              <span className={styles.dot} style={{ background: active ? "#16a34a" : "#dc2626" }} />
              {profile.lastActivity
                ? `Aktif ${relativeTime(profile.lastActivity.at, now).toLowerCase()}, mengerjakan “${profile.lastActivity.lesson}”`
                : "Belum pernah mengerjakan materi"}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          {student.parent_whatsapp && (
            <a
              href={buildWaLink(
                student.parent_whatsapp,
                `Halo ${student.parent_name || "Bapak/Ibu"}, kami dari Supercoder ingin berbagi perkembangan belajar ${name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnGhost}
            >
              <MessageCircle size={16} aria-hidden="true" />
              WA orang tua{student.parent_name ? ` (${student.parent_name})` : ""}
            </a>
          )}
          <Link
            href={`/admin/gradebook/${student.id}/rapor${back ? `?back=${encodeURIComponent(back)}` : ""}`}
            className={styles.btnMain}
          >
            <FileText size={16} aria-hidden="true" />
            Rapor bulanan
          </Link>
        </div>
      </div>

      <div className={styles.kpis} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <span className={styles.kpiValue}>
              <span className={styles.kpiNumber}>{k.value}</span>
              {k.suffix && <span className={styles.kpiSuffix}>{k.suffix}</span>}
            </span>
            <span className={`${styles.kpiHint} ${k.hintClass ?? ""}`}>{k.hint}</span>
          </div>
        ))}
      </div>

      <div className={styles.split}>
        <ScoreSources sources={profile.sources} />
        <RetryList retry={profile.retry} />
      </div>

      <ActivityTimeline timeline={profile.timeline} />
      <SubjectProgress subjects={profile.subjects} />
    </div>
  );
}
