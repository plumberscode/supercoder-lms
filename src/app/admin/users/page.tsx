import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import { approveUser } from "./actions";
import RoleSelector from "./RoleSelector";
import ParentContactForm from "./ParentContactForm";
import StudentActiveToggle from "./StudentActiveToggle";
import Link from "next/link";

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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (STATUS_FILTERS.some((f) => f.key && f.key === statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  const { data: users, error } = await query;

  if (error) return <div>Gagal memuat data pengguna: {error.message}</div>;

  // Nomor WA dari formulir pendaftaran dipakai sebagai saran bila WA orang tua belum diisi.
  const { data: registrations } = await supabase
    .from("registrations")
    .select("email, whatsapp_number")
    .order("created_at", { ascending: false });
  const waFromRegistration = new Map<string, string>();
  registrations?.forEach((r) => {
    const email = r.email?.toLowerCase();
    if (email && r.whatsapp_number && !waFromRegistration.has(email)) {
      waFromRegistration.set(email, r.whatsapp_number);
    }
  });

  return (
    <div>
      <h1 className={styles.pageTitle}>Manajemen Pengguna</h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => {
          const active = f.key === statusFilter;
          return (
            <Link
              key={f.key || "all"}
              href={f.key ? `/admin/users?status=${f.key}` : "/admin/users"}
              className={active ? "btn btn-primary" : "btn"}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

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
                      ? `MINAS · ${user.username}`
                      : user.email}
                  </div>
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
                  {user.status === "pending" ? (
                    <form action={approveUser.bind(null, user.id)}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                      >
                        Setujui
                      </button>
                    </form>
                  ) : user.role === "student" &&
                    (user.status === "approved" || user.status === "inactive") ? (
                    <StudentActiveToggle
                      userId={user.id}
                      studentName={user.full_name || user.email}
                      isActive={user.status === "approved"}
                    />
                  ) : (
                    <span style={{ color: "#CBD5E1" }}>—</span>
                  )}
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
