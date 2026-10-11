"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function InactiveAccountPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        padding: "20px",
      }}
    >
      <div
        className="card"
        style={{ maxWidth: "450px", textAlign: "center", padding: "48px" }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "24px" }}>💤</div>
        <h1 style={{ marginBottom: "16px" }}>Akun Tidak Aktif</h1>
        <p style={{ color: "#64748B", lineHeight: 1.6, marginBottom: "32px" }}>
          Akunmu sedang dinonaktifkan, jadi materi belajar belum bisa diakses.
          Tenang, semua progres, XP, dan nilaimu tetap tersimpan. Hubungi admin
          Supercoder jika ingin bergabung kembali.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/dashboard")}
          >
            Cek Status Lagi
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ backgroundColor: "transparent", color: "#64748B" }}
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
