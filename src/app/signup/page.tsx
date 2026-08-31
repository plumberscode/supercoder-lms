"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import styles from "../login/login.module.css";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          Super<span>coder</span>
        </div>
        <h1 className={styles.title}>Buat Akun Baru</h1>
        <p className={styles.subtitle}>
          Bergabunglah dengan komunitas Supercoder hari ini
        </p>

        {success ? (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#DCFCE7",
              borderRadius: "12px",
              color: "#166534",
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600 }}>Pendaftaran Berhasil!</p>
            <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
              Silakan cek email Anda untuk konfirmasi akun. Setelah itu, Anda
              bisa masuk.
            </p>
            <a
              href="/login"
              className="btn btn-primary"
              style={{ marginTop: "20px", width: "100%" }}
            >
              Pergi ke Halaman Masuk
            </a>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">Nama Lengkap</label>
              <input
                id="fullName"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Alamat Email</label>
              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Kata Sandi</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    fontSize: "1.25rem",
                    padding: "4px",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: "var(--primary)", fontSize: "0.875rem" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
            <p className={styles.footerText}>
              Sudah punya akun? <a href="/login">Masuk di sini</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
