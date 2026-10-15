import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import { approveUser } from "./actions";
import RoleSelector from "./RoleSelector";
import ParentContactForm from "./ParentContactForm";
import StudentActiveToggle from "./StudentActiveToggle";
import Link from "next/link";
import { PROGRAMS } from "@/lib/student-access";

const STATUS_FILTERS = [
  { key: "", label: "Semua" },
  { key: "approved", label: "Aktif" },
  { key: "pending", label: "Menunggu" },
  { key: "inactive", label: "Nonaktif" },
];

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: "Disetujui", bg: "#DCFCE7", color: "#166534" },
  inactive: { label: "Nonaktif", bg: "#E2E8F0", color: "#475569" },
  pending: { label: "Menunggu", bg: "#FEE2E2", color: "#991B1B" },
};

const PROGRAM_FILTERS = [{ key: "", label: "Semua Program" }].concat(
  PROGRAMS.map((p) => ({ key: p.value, label: p.label })),
);

const PROGRAM_BADGE: Record<string, { bg: string; color: string }> = {
  supercoder: { bg: "#E0E7FF", color: "#3730A3" },
  minas: { bg: "#CCFBF1", color: "#115E59" },
  teaser: { bg: "#FFEDD5", color: "#9A3412" },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; program?: string }>;
}) {
  const { status: statusFilter = "", program: programFilter = "" } =
    await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (STATUS_FILTERS.some((f) => f.key && f.key === statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  if (PROGRAM_FILTERS.some((f) => f.key && f.key === programFilter)) {
    query = query.eq("program", programFilter);
  }
  const { data: users, error } = await query;

  if (error) return <div>Gagal memuat data pengguna: {error.message}</div>;

  // Nomor WA dari formulir pendaftaran dipakai sebagai saran bila WA orang tua belum diisi.
  // Pendaftaran lunas menandai akun teaser yang siap dinaikkan ke Supercoder.
  const { data: registrations } = await supabase
    .from("registrations")
    .select("email, whatsapp_number, payment_status")
    .order("created_at", { ascending: false });
  const waFromRegistration = new Map<string, string>();
  const paidEmails = new Set<string>();
  registrations?.forEach((r) => {
    const email = r.email?.toLowerCase();
    if (email && r.whatsapp_number && !waFromRegistration.has(email)) {
      waFromRegistration.set(email, r.whatsapp_number);
    }
    if (email && r.payment_status === "paid") paidEmails.add(email);
  });

  const filterHref = (status: string, program: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (program) params.set("program", program);
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Manajemen Pengguna</h1>

      {[
        { filters: STATUS_FILTERS, current: statusFilter, href: (key: string) => filterHref(key, programFilter) },
        { filters: PROGRAM_FILTERS, current: programFilter, href: (key: string) => filterHref(statusFilter, key) },
      ].map((group, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}
        >
          {group.filters.map((f) => (
            <Link
              key={f.key || "all"}
              href={group.href(f.key)}
              className={f.key === group.current ? "btn btn-primary" : "btn"}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              {f.label}
            </Link>
          ))}
        </div>
      ))}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead
            style={{
              backgroundColor: "#F8FAFC",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <tr>
              <th style={{ padding: "16px 24px" }}>Nama / Email</th>
              <th style={{ padding: "16px 24px" }}>Peran</th>
              <th style={{ padding: "16px 24px" }}>Status</th>
              <th style={{ padding: "16px 24px" }}>Orang Tua (untuk Rapor)</th>
              <th style={{ padding: "16px 24px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => {
              const badge = STATUS_BADGE[user.status] ?? STATUS_BADGE.pending;
              return (
              <tr
                key={user.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  opacity: user.status === "inactive" ? 0.6 : 1,
                }}
              >
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ fontWeight: 600 }}>
                    {user.full_name || "Tanpa Nama"}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#64748B" }}>
                    {user.program === "minas" && user.username
                      ? user.username
                      : user.email}
                  </div>
                  {user.role === "student" && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: PROGRAM_BADGE[user.program]?.bg,
                          color: PROGRAM_BADGE[user.program]?.color,
                        }}
                      >
                        {PROGRAMS.find((p) => p.value === user.program)?.label ?? user.program}
                      </span>
                      {user.program === "teaser" &&
                        paidEmails.has(user.email?.toLowerCase()) && (
                          <span
                            className="badge"
                            style={{ backgroundColor: "#DCFCE7", color: "#166534" }}
                            title="Email ini cocok dengan pendaftaran yang sudah lunas"
                          >
                            💰 Sudah bayar
                          </span>
                        )}
                    </div>
                  )}
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <RoleSelector userId={user.id} currentRole={user.role} />
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <span
                    className="badge"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {user.status === "inactive" && user.deactivated_at && (
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                      sejak{" "}
                      {new Date(user.deactivated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </td>
                <td style={{ padding: "16px 24px", minWidth: "220px" }}>
                  {user.role === "student" && (
                    <ParentContactForm
                      userId={user.id}
                      parentName={user.parent_name}
                      parentWhatsapp={user.parent_whatsapp}
                      suggestedWhatsapp={waFromRegistration.get(user.email?.toLowerCase())}
                    />
                  )}
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {/* approveUser = jadikan Supercoder (status approved + program supercoder) */}
                    {(user.status === "pending" ||
                      (user.role === "student" && user.program === "teaser")) && (
                        <form action={approveUser.bind(null, user.id)}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                          >
                            Jadikan Supercoder
                          </button>
                        </form>
                      )}
                    {user.role === "student" &&
                    (user.status === "approved" || user.status === "inactive") ? (
                      <StudentActiveToggle
                        userId={user.id}
                        studentName={user.full_name || user.email}
                        isActive={user.status === "approved"}
                      />
                    ) : (
                      user.status !== "pending" && (
                        <span style={{ color: "#CBD5E1" }}>—</span>
                      )
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
