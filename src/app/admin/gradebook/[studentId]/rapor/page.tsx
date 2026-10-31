import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { formatWita } from "@/lib/gradebook";
import {
  buildNoteHints,
  buildReportSnapshot,
  currentPeriod,
  formatPeriod,
  normalizePeriod,
  periodRange,
  recentPeriods,
  shiftPeriod,
  type ReportSnapshot,
} from "@/lib/reports";
import { PROGRAMS } from "@/lib/student-access";
import { buildWaLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site";
import { publishReport, saveReport, unpublishReport } from "@/app/admin/reports/actions";
import PeriodPicker from "./PeriodPicker";
import RaporWorkspace from "./RaporWorkspace";
import SendPanel from "./SendPanel";
import gb from "../../gradebook.module.css";
import styles from "./rapor.module.css";

type CheckItem = { tone: "ok" | "warn" | "info"; text: string; link?: { href: string; label: string } };

const CHECK_ICONS = { ok: Check, warn: AlertTriangle, info: Info };

export default async function StudentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ period?: string; back?: string; from?: string }>;
}) {
  const { studentId } = await params;
  const query = await searchParams;
  const now = new Date();
  const thisMonth = currentPeriod(now);
  const requested = normalizePeriod(query.period) || thisMonth;
  // Rapor bulan depan belum ada isinya.
  const period = requested > thisMonth ? thisMonth : requested;
  const supabase = await createClient();

  const [studentRes, reportRes, historyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, email, role, program, parent_name, parent_whatsapp")
      .eq("id", studentId)
      .maybeSingle(),
    supabase.from("monthly_reports").select("*").eq("student_id", studentId).eq("period", period).maybeSingle(),
    supabase.from("monthly_reports").select("period, status, sent_at").eq("student_id", studentId),
  ]);
  const student = studentRes.data;
  if (!student || student.role !== "student") notFound();
  const report = reportRes.data;

  const isPublished = report?.status === "published";
  const isSent = isPublished && !!report?.sent_at;
  // Draf selalu memakai data terbaru; rapor terbit memakai snapshot yang dibekukan.
  const snapshot: ReportSnapshot =
    isPublished && report?.snapshot
      ? report.snapshot
      : await buildReportSnapshot(supabase, student.id, period);

  // Nilai yang masuk setelah rapor terbit belum tercantum di rapor.
  let newSincePublish = 0;
  if (isPublished && report?.published_at) {
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .gt("submitted_at", report.published_at)
      .lt("submitted_at", periodRange(period).end);
    newSincePublish = count ?? 0;
  }

  const name = student.full_name || "Tanpa Nama";
  const programLabel = PROGRAMS.find((p) => p.value === student.program)?.label ?? student.program;

  const hrefFor = (p: string) => {
    const qs = new URLSearchParams({ period: p.slice(0, 7) });
    if (query.back) qs.set("back", query.back);
    if (query.from) qs.set("from", query.from);
    return `/admin/gradebook/${student.id}/rapor?${qs}`;
  };
  const profileHref = `/admin/gradebook/${student.id}${query.back ? `?back=${encodeURIComponent(query.back)}` : ""}`;

  const statusOf = new Map(
    (historyRes.data ?? []).map((r) => [
      r.period,
      r.status === "draft" ? "Draf" : r.sent_at ? "Terkirim" : "Terbit",
    ]),
  );
  const periods = recentPeriods(12, now);
  if (!periods.includes(period)) periods.push(period);
  const periodOptions = periods.map((p) => ({
    value: p,
    href: hrefFor(p),
    label: [formatPeriod(p), p === thisMonth && "(berjalan)", statusOf.get(p) && `· ${statusOf.get(p)}`]
      .filter(Boolean)
      .join(" "),
  }));
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const hasNext = next <= thisMonth;

  const steps = [
    {
      label: "Draf",
      hint: !report
        ? "Belum disimpan; terbentuk saat pertama kali disimpan"
        : isPublished
          ? "Catatan tersimpan"
          : "Nilai mengikuti data terbaru",
      state: isPublished ? "done" : "current",
    },
    {
      label: "Terbit",
      hint:
        isPublished && report?.published_at
          ? `Nilai dibekukan ${formatWita(report.published_at)}`
          : "Nilai dibekukan, link dibuat",
      state: isSent ? "done" : isPublished ? "current" : "todo",
    },
    {
      label: "Terkirim",
      hint: isSent ? `Dikirim ${formatWita(report!.sent_at)}` : "Ditandai setelah WA dikirim",
      state: isSent ? "done" : "todo",
    },
  ];

  const pending = snapshot.activities.filter((a) => a.score === null && a.xp == null);
  const checks: CheckItem[] = [
    snapshot.activities.length > 0
      ? { tone: "ok", text: `${snapshot.activities.length} aktivitas tercatat bulan ini` }
      : {
          tone: "warn",
          text: "Tidak ada aktivitas LMS bulan ini. Isi “Kegiatan bulan ini” agar orang tua tahu alasannya.",
        },
  ];
  if (pending.length > 0) {
    checks.push({
      tone: "warn",
      text: `${pending.length} tugas menunggu dinilai: ${pending.map((a) => a.lesson).join(", ")}.`,
      link: { href: "/admin/submissions", label: "Nilai sekarang" },
    });
  }
  checks.push(
    student.parent_whatsapp
      ? { tone: "ok", text: `WA orang tua: ${student.parent_whatsapp}` }
      : { tone: "warn", text: "WA orang tua belum diisi.", link: { href: "/admin/users", label: "Lengkapi" } },
  );
  if (newSincePublish > 0) {
    checks.push({
      tone: "warn",
      text: `Ada ${newSincePublish} nilai baru sejak rapor terbit. Tekan “Simpan & perbarui nilai” untuk memasukkannya.`,
    });
  }
  if (period === thisMonth) {
    checks.push({
      tone: "info",
      text: "Bulan ini belum selesai; nilai masih bisa bertambah sampai akhir bulan.",
    });
  }

  const publicUrl = report?.public_token ? `${SITE_URL}/rapor/${report.public_token}` : null;
  const waMessage = publicUrl
    ? `Halo Bapak/Ibu${student.parent_name ? ` ${student.parent_name}` : ""}, berikut rapor belajar ${
        snapshot.student.name
      } di Supercoder untuk bulan ${formatPeriod(period)}:\n\n${publicUrl}\n\nTerima kasih atas dukungannya 🙏`
    : null;

  return (
    <div className={gb.page}>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        {query.from === "reports" ? (
          <Link href={`/admin/reports?period=${period.slice(0, 7)}`}>Rapor Bulanan</Link>
        ) : (
          <Link href={`/admin/gradebook${query.back ? `?${query.back}` : ""}`}>Buku Nilai</Link>
        )}
        <span aria-hidden="true">›</span>
        <Link href={profileHref}>{name}</Link>
        <span aria-hidden="true">›</span>
        <span className={styles.crumbCurrent}>Rapor bulanan</span>
      </nav>

      <header className={gb.header}>
        <div className={gb.stack} style={{ gap: 6 }}>
          <h1 className={gb.title}>Rapor {name}</h1>
          <div className={styles.identityMeta}>
            <span className={gb.programTag}>{programLabel}</span>
            <span>{student.username ? `@${student.username}` : student.email}</span>
            <span aria-hidden="true">·</span>
            <span>
              {student.parent_name ? `Orang tua: ${student.parent_name}` : "Nama orang tua belum diisi"}
            </span>
          </div>
        </div>
        <div className={styles.periodNav}>
          <Link href={hrefFor(prev)} className={styles.iconBtn} aria-label="Bulan sebelumnya">
            <ChevronLeft size={18} aria-hidden="true" />
          </Link>
          <PeriodPicker value={period} options={periodOptions} />
          {hasNext ? (
            <Link href={hrefFor(next)} className={styles.iconBtn} aria-label="Bulan berikutnya">
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span className={`${styles.iconBtn} ${styles.iconBtnOff}`} aria-hidden="true">
              <ChevronRight size={18} />
            </span>
          )}
        </div>
      </header>

      <ol className={`${gb.panel} ${styles.steps}`} aria-label="Status rapor">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={`${styles.step} ${
              s.state === "done" ? styles.stepDone : s.state === "current" ? styles.stepCurrent : styles.stepTodo
            }`}
            aria-current={s.state === "current" ? "step" : undefined}
          >
            <span className={styles.stepDot}>
              {s.state === "done" ? <Check size={16} strokeWidth={3} aria-label="Selesai" /> : i + 1}
            </span>
            <span className={gb.stack}>
              <span className={styles.stepLabel}>{s.label}</span>
              <span className={styles.stepHint}>{s.hint}</span>
            </span>
          </li>
        ))}
      </ol>

      <RaporWorkspace
        key={period}
        snapshot={snapshot}
        initialNotes={{
          month_note: report?.month_note ?? null,
          strengths: report?.strengths ?? null,
          improvements: report?.improvements ?? null,
          parent_advice: report?.parent_advice ?? null,
        }}
        hints={buildNoteHints(snapshot)}
        isPublished={isPublished}
        previewNote={
          isPublished && report?.published_at
            ? `Terbit: angka dibekukan ${formatWita(report.published_at)} WITA`
            : "Draf: angka diperbarui otomatis sampai rapor diterbitkan"
        }
        saveAction={saveReport.bind(null, student.id, period)}
        publishAction={publishReport.bind(null, student.id, period)}
        checks={
          <section className={`${gb.panel} ${styles.card}`}>
            <h2 className={styles.cardTitle}>Cek sebelum terbit</h2>
            <ul className={styles.checks}>
              {checks.map((c) => {
                const Icon = CHECK_ICONS[c.tone];
                return (
                  <li key={c.text} className={styles.check}>
                    <Icon
                      size={18}
                      aria-hidden="true"
                      className={c.tone === "ok" ? styles.ok : c.tone === "warn" ? styles.warn : undefined}
                    />
                    <span>
                      {c.text}
                      {c.link && (
                        <>
                          {" "}
                          <Link href={c.link.href}>{c.link.label}</Link>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        }
        sendPanel={
          <section className={`${gb.panel} ${styles.card}`}>
            <h2 className={styles.cardTitle}>Kirim ke orang tua</h2>
            {isPublished && report && publicUrl && waMessage ? (
              <SendPanel
                reportId={report.id}
                message={waMessage}
                waLink={student.parent_whatsapp ? buildWaLink(student.parent_whatsapp, waMessage) : null}
                publicUrl={publicUrl}
                sentLabel={report.sent_at ? `Terkirim ${formatWita(report.sent_at)} WITA` : null}
                unpublishAction={unpublishReport.bind(null, report.id)}
              />
            ) : (
              <span className={styles.hint}>
                Terbitkan rapor dulu. Setelah terbit, link rapor dan pesan WhatsApp siap dikirim dari sini.
              </span>
            )}
          </section>
        }
      />
    </div>
  );
}
