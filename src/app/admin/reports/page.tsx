import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import { createDrafts } from "./actions";
import StatusBadge from "./StatusBadge";
import {
  formatPeriod,
  normalizePeriod,
  previousPeriod,
  recentPeriods,
} from "@/lib/reports";

const cell = { padding: "14px 20px" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = normalizePeriod(params.period) || previousPeriod();
  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from("monthly_reports")
    .select(
      "id, status, sent_at, published_at, profiles!monthly_reports_student_id_fkey(full_name, email, parent_whatsapp)",
    )
    .eq("period", period);

  if (error) {
    return (
      <div>
        Gagal memuat rapor: {error.message}. Pastikan migration_monthly_reports.sql
        sudah dijalankan.
      </div>
    );
  }

  const rows = (reports || [])
    .map((r: any) => ({
      ...r,
      student: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
    }))
    .sort((a, b) =>
      (a.student?.full_name || "").localeCompare(b.student?.full_name || ""),
    );

  const counts = {
    draft: rows.filter((r) => r.status === "draft").length,
    published: rows.filter((r) => r.status === "published" && !r.sent_at).length,
    sent: rows.filter((r) => r.status === "published" && r.sent_at).length,
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>📝 Rapor Bulanan</h1>

      <div
        className="card"
        style={{
          marginBottom: "24px",
          display: "flex",
          gap: "16px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <form method="get" style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            <div style={{ marginBottom: "6px" }}>Periode</div>
            <select
              name="period"
              defaultValue={period.slice(0, 7)}
              className="input"
              style={{ padding: "8px 12px", borderRadius: "8px" }}
            >
              {recentPeriods(12).map((p) => (
                <option key={p} value={p.slice(0, 7)}>
                  {formatPeriod(p)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn">
            Tampilkan
          </button>
        </form>

        <form action={createDrafts} style={{ marginLeft: "auto" }}>
          <input type="hidden" name="period" value={period} />
          <button type="submit" className="btn btn-primary">
            ➕ Buat Draf untuk Semua Siswa
          </button>
        </form>
      </div>

      <p style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "0.9rem" }}>
        {formatPeriod(period)}: {counts.draft} draf · {counts.published} terbit (belum
        dikirim) · {counts.sent} sudah dikirim
      </p>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead
            style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--border)" }}
          >
            <tr>
              <th style={cell}>Siswa</th>
              <th style={cell}>WA Orang Tua</th>
              <th style={cell}>Status</th>
              <th style={cell}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...cell, textAlign: "center", color: "var(--text-muted)" }}>
                  Belum ada rapor untuk periode ini. Tekan &quot;Buat Draf untuk Semua
                  Siswa&quot; untuk memulai.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{r.student?.full_name || "Tanpa Nama"}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{r.student?.email}</div>
                </td>
                <td style={cell}>
                  {r.student?.parent_whatsapp ? (
                    <span style={{ fontSize: "0.875rem" }}>{r.student.parent_whatsapp}</span>
                  ) : (
                    <Link href="/admin/users" style={{ fontSize: "0.8rem", color: "#D97706" }}>
                      ⚠️ Belum diisi
                    </Link>
                  )}
                </td>
                <td style={cell}>
                  <StatusBadge status={r.status} sentAt={r.sent_at} />
                </td>
                <td style={cell}>
                  <Link
                    href={`/admin/reports/${r.id}`}
                    className="btn"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    {r.status === "draft" ? "Isi & Terbitkan" : "Buka"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
