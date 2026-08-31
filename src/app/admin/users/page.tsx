import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import { approveUser } from "./actions";
import RoleSelector from "./RoleSelector";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <div>Gagal memuat data pengguna: {error.message}</div>;

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
