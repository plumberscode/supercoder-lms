import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "../../admin.module.css";
import ReportView from "@/components/reports/ReportView";
import { buildReportSnapshot, formatPeriod, type ReportSnapshot } from "@/lib/reports";
import { buildWaLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site";
import { publishReport, saveNotes, unpublishReport } from "../actions";
import SendWaButton from "../SendWaButton";
import StatusBadge from "../StatusBadge";

const textareaStyle = {
  width: "100%",
  minHeight: "90px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  lineHeight: 1.5,
  resize: "vertical" as const,
};

const noteFields = [
  {
    name: "strengths",
    label: "💪 Kekuatan",
    placeholder: "Contoh: Cepat memahami konsep perulangan dan rajin bertanya.",
  },
  {
    name: "improvements",
    label: "🎯 Yang Perlu Ditingkatkan",
    placeholder: "Contoh: Perlu lebih teliti membaca soal sebelum mengerjakan.",
  },
  {
    name: "parent_advice",
    label: "🏠 Saran untuk Orang Tua",
    placeholder: "Contoh: Ajak ananda menceritakan proyek yang sedang dibuat setiap minggu.",
  },
] as const;

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("monthly_reports")
    .select(
      "*, profiles!monthly_reports_student_id_fkey(full_name, email, parent_name, parent_whatsapp)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!report) notFound();

  const student = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
  const isPublished = report.status === "published";

  // Draf selalu memakai data terbaru; rapor terbit memakai snapshot yang dibekukan.
  const snapshot: ReportSnapshot =
    isPublished && report.snapshot
      ? report.snapshot
      : await buildReportSnapshot(supabase, report.student_id, report.period);

  const publicUrl = report.public_token ? `${SITE_URL}/rapor/${report.public_token}` : null;
  const waLink =
    publicUrl && student?.parent_whatsapp
      ? buildWaLink(
          student.parent_whatsapp,
          `Halo Bapak/Ibu${student.parent_name ? ` ${student.parent_name}` : ""}, berikut rapor belajar ${
            snapshot.student.name
          } di Supercoder untuk bulan ${formatPeriod(report.period)}:\n\n${publicUrl}\n\nTerima kasih atas dukungannya 🙏`,
        )
      : null;

  return (
    <div>
      <Link href={`/admin/reports?period=${report.period.slice(0, 7)}`} style={{ fontSize: "0.875rem" }}>
        ← Kembali ke daftar rapor
      </Link>
      <h1 className={styles.pageTitle} style={{ marginTop: "12px" }}>
        Rapor {student?.full_name || "Siswa"} · {formatPeriod(report.period)}{" "}
        <StatusBadge status={report.status} sentAt={report.sent_at} />
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 400px) 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <form className="card" action={saveNotes.bind(null, id)}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>
              Catatan Guru
            </h2>
            {noteFields.map((f) => (
              <label key={f.name} style={{ display: "block", marginBottom: "14px" }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "6px" }}>
                  {f.label}
                </div>
                <textarea
                  name={f.name}
                  defaultValue={report[f.name] || ""}
                  placeholder={f.placeholder}
                  style={textareaStyle}
                />
              </label>
            ))}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="submit" className="btn">
                💾 Simpan
              </button>
              <button
                type="submit"
                formAction={publishReport.bind(null, id)}
                className="btn btn-primary"
              >
                {isPublished ? "🔄 Simpan & Perbarui Nilai" : "🚀 Simpan & Terbitkan"}
              </button>
            </div>
            {isPublished && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px" }}>
                &quot;Simpan&quot; hanya mengubah catatan. &quot;Perbarui Nilai&quot; juga mengambil
                ulang data nilai terbaru untuk bulan ini.
              </p>
            )}
          </form>

          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>
              Kirim ke Orang Tua
            </h2>
            <div style={{ fontSize: "0.875rem", marginBottom: "12px" }}>
              {student?.parent_name || "Nama orang tua belum diisi"} ·{" "}
              {student?.parent_whatsapp || (
                <Link href="/admin/users" style={{ color: "#D97706" }}>
                  WA belum diisi
                </Link>
              )}
            </div>

            {!isPublished ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Terbitkan rapor terlebih dahulu untuk mendapatkan link.
              </p>
            ) : (
              <>
                <div style={{ fontSize: "0.8rem", wordBreak: "break-all", marginBottom: "12px" }}>
                  <a href={publicUrl!} target="_blank" rel="noopener noreferrer">
                    {publicUrl}
                  </a>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {waLink && (
                    <SendWaButton reportId={id} waLink={waLink} alreadySent={!!report.sent_at} />
                  )}
                  <form action={unpublishReport.bind(null, id)}>
                    <button type="submit" className="btn" style={{ color: "#B91C1C" }}>
                      Tarik ke Draf
                    </button>
                  </form>
                </div>
                {report.sent_at && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px" }}>
                    Terakhir dikirim:{" "}
                    {new Date(report.sent_at).toLocaleString("id-ID", {
                      timeZone: "Asia/Makassar",
                    })}{" "}
                    WITA
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          {!isPublished && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
              Pratinjau memakai data nilai terbaru. Data akan dibekukan saat rapor diterbitkan.
            </p>
          )}
          <ReportView snapshot={snapshot} notes={report} />
        </div>
      </div>
    </div>
  );
}
