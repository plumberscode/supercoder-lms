import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import { updateRegistrationStatus, deleteRegistration } from "./actions";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { PROMO_VOUCHER_CODE } from "@/lib/promo";

export default async function AdminRegistrationsPage() {
  const supabase = await createClient();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className={styles.pageTitle}>Data Pendaftaran Siswa Baru</h1>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
            borderRadius: "12px",
          }}
        >
          Gagal memuat data pendaftaran: {error.message}
          <br />
          <small>
            Pastikan tabel <code>registrations</code> telah dibuat di Supabase
            (jalankan <code>migration_registrations.sql</code>).
          </small>
        </div>
      </div>
    );
  }

  const totalCount = registrations?.length || 0;
  const pendingCount =
    registrations?.filter((r) => r.status === "pending" || !r.status).length ||
    0;
  const contactedCount =
    registrations?.filter((r) => r.status === "contacted").length || 0;
  const enrolledCount =
    registrations?.filter((r) => r.status === "enrolled").length || 0;
  const voucherCount =
    registrations?.filter(
      (r) =>
        r.voucher_code?.toString().trim().toUpperCase() ===
        PROMO_VOUCHER_CODE,
    ).length || 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: "4px" }}>
            Data Pendaftaran Siswa Baru
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem" }}>
            Daftar calon siswa yang telah mengisi form pendaftaran di website.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card" style={{ padding: "20px" }}>
          <div
            style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}
          >
            Total Pendaftar
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#0F172A",
              marginTop: "4px",
            }}
          >
            {totalCount}
          </div>
        </div>
        <div
          className="card"
          style={{ padding: "20px", borderLeft: "4px solid #F59E0B" }}
        >
          <div
            style={{ fontSize: "0.85rem", color: "#D97706", fontWeight: 600 }}
          >
            Menunggu Dihubungi
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#D97706",
              marginTop: "4px",
            }}
          >
            {pendingCount}
          </div>
        </div>
        <div
          className="card"
          style={{ padding: "20px", borderLeft: "4px solid #3B82F6" }}
        >
          <div
            style={{ fontSize: "0.85rem", color: "#2563EB", fontWeight: 600 }}
          >
            Sudah Dihubungi
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#2563EB",
              marginTop: "4px",
            }}
          >
            {contactedCount}
          </div>
        </div>
        <div
          className="card"
          style={{ padding: "20px", borderLeft: "4px solid #10B981" }}
        >
          <div
            style={{ fontSize: "0.85rem", color: "#059669", fontWeight: 600 }}
          >
            Resmi Terdaftar
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#059669",
              marginTop: "4px",
            }}
          >
            {enrolledCount}
          </div>
        </div>
        <div
          className="card"
          style={{ padding: "20px", borderLeft: "4px solid #EC4899" }}
        >
          <div
            style={{ fontSize: "0.85rem", color: "#DB2777", fontWeight: 600 }}
          >
            🎉 Pakai Voucher Promo 9.9
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#DB2777",
              marginTop: "4px",
            }}
          >
            {voucherCount}
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {registrations && registrations.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "850px",
              }}
            >
              <thead
                style={{
                  backgroundColor: "#F8FAFC",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    Calon Siswa
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    Kelas Pilihan
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    Kontak & Alamat
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    Waktu Daftar
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    Status Follow-up
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "#475569",
                      textAlign: "right",
                    }}
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item) => {
                  let cleanPhone =
                    item.whatsapp_number?.replace(/\D/g, "") || "";
                  if (cleanPhone.startsWith("0")) {
                    cleanPhone = "62" + cleanPhone.substring(1);
                  }
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Halo ${item.student_name}, perkenalkan kami dari Supercoder. Terima kasih telah mendaftar untuk program ${item.selected_class}. Kami ingin memberikan informasi jadwal dan detail kelas.`,
                  )}`;

                  const usedVoucher =
                    item.voucher_code?.toString().trim().toUpperCase() ===
                    PROMO_VOUCHER_CODE;

                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      {/* Name */}
                      <td style={{ padding: "16px 20px" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0F172A",
                            fontSize: "0.95rem",
                          }}
                        >
                          {item.student_name}
                        </div>
                        {usedVoucher && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "6px",
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              backgroundColor: "#FCE7F3",
                              color: "#DB2777",
                              border: "1px solid #FBCFE8",
                            }}
                            title={`Menggunakan kode voucher: ${item.voucher_code}`}
                          >
                            <Ticket size={11} />
                            Pakai Voucher Promo 9.9
                          </div>
                        )}
                      </td>

                      {/* Class */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor:
                              item.selected_class === "Weekend Coding Class"
                                ? "#FFEDD5"
                                : item.selected_class === "Premium Online Class"
                                  ? "#DBEAFE"
                                  : "#DCFCE7",
                            color:
                              item.selected_class === "Weekend Coding Class"
                                ? "#C2410C"
                                : item.selected_class === "Premium Online Class"
                                  ? "#1D4ED8"
                                  : "#15803D",
                          }}
                        >
                          {item.selected_class}
                        </span>
                      </td>

                      {/* Contact & Address */}
                      <td style={{ padding: "16px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#16A34A",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            💬 {item.whatsapp_number}
                          </a>
                          <div style={{ color: "#64748B", fontSize: "0.8rem" }}>
                            ✉️ {item.email}
                          </div>
                          <div
                            style={{
                              color: "#475569",
                              fontSize: "0.8rem",
                              maxWidth: "240px",
                            }}
                          >
                            📍 {item.address}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: "0.85rem",
                          color: "#64748B",
                        }}
                      >
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px" }}>
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const newStatus =
                              formData.get("status")?.toString() || "pending";
                            await updateRegistrationStatus(item.id, newStatus);
                          }}
                        >
                          <select
                            name="status"
                            defaultValue={item.status || "pending"}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              border: "1px solid #CBD5E1",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              backgroundColor: "#FFFFFF",
                              cursor: "pointer",
                            }}
                            // @ts-ignore
                            onChange="this.form.requestSubmit()"
                          >
                            <option value="pending">⏳ Menunggu</option>
                            <option value="contacted">📞 Dihubungi</option>
                            <option value="enrolled">✅ Terdaftar</option>
                            <option value="cancelled">❌ Batal</option>
                          </select>
                        </form>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px",
                          }}
                        >
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              backgroundColor: "#22C55E",
                              color: "#FFFFFF",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            Chat WA
                          </a>

                          <form
                            action={deleteRegistration.bind(null, item.id)}
                            style={{ display: "inline" }}
                          >
                            <button
                              type="submit"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #FCA5A5",
                                backgroundColor: "#FEF2F2",
                                color: "#DC2626",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              Hapus
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#64748B",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📝</div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "#1E293B",
                marginBottom: "6px",
              }}
            >
              Belum Ada Pendaftar
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                maxWidth: "400px",
                margin: "0 auto",
              }}
            >
              Ketika calon siswa mengisi formulir di website Supercoder
              (/daftar), datanya akan muncul di sini secara otomatis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
