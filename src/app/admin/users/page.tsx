import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import { approveUser, updateParentContact } from "./actions";
import RoleSelector from "./RoleSelector";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

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

  const inputStyle = {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    fontSize: "0.8rem",
    width: "100%",
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Manajemen Pengguna</h1>

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
            {users?.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ fontWeight: 600 }}>
                    {user.full_name || "Tanpa Nama"}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#64748B" }}>
                    {user.email}
                  </div>
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <RoleSelector userId={user.id} currentRole={user.role} />
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        user.status === "approved" ? "#DCFCE7" : "#FEE2E2",
                      color: user.status === "approved" ? "#166534" : "#991B1B",
                    }}
                  >
                    {user.status === "approved" ? "Disetujui" : "Menunggu"}
                  </span>
                </td>
                <td style={{ padding: "16px 24px", minWidth: "220px" }}>
                  {user.role === "student" && (
                    <form
                      action={updateParentContact.bind(null, user.id)}
                      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                    >
                      <input
                        name="parent_name"
                        defaultValue={user.parent_name || ""}
                        placeholder="Nama orang tua"
                        style={inputStyle}
                      />
                      <input
                        name="parent_whatsapp"
                        defaultValue={user.parent_whatsapp || ""}
                        placeholder={
                          waFromRegistration.get(user.email?.toLowerCase()) ||
                          "No. WA orang tua"
                        }
                        style={inputStyle}
                      />
                      {!user.parent_whatsapp &&
                        waFromRegistration.has(user.email?.toLowerCase()) && (
                          <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                            Saran dari pendaftaran:{" "}
                            {waFromRegistration.get(user.email?.toLowerCase())}{" "}
                            (cek apakah ini nomor orang tua)
                          </div>
                        )}
                      <button
                        type="submit"
                        className="btn"
                        style={{ padding: "4px 10px", fontSize: "0.75rem", alignSelf: "flex-start" }}
                      >
                        Simpan
                      </button>
                    </form>
                  )}
                </td>
                <td style={{ padding: "16px 24px" }}>
                  {user.status === "pending" && (
                    <form action={approveUser.bind(null, user.id)}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                      >
                        Setujui
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
