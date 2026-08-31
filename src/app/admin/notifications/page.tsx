import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className={styles.pageTitle}>Notifikasi Sistem</h1>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {notifications?.length === 0 ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#64748B" }}
          >
            Belum ada notifikasi terbaru.
          </div>
        ) : (
          notifications?.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: "20px 32px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: notif.is_read ? "#E2E8F0" : "var(--primary)",
                  marginTop: "6px",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                  {notif.title}
                </div>
                <p style={{ color: "#64748B", fontSize: "0.9375rem" }}>
                  {notif.message}
                </p>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#94A3B8",
                    marginTop: "12px",
                  }}
                >
                  {new Date(notif.created_at).toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
