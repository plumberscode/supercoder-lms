"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else window.location.href = "/dashboard";
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          Super<span>coder</span>
        </div>
        <h1 className={styles.title}>Selamat Datang Kembali</h1>
        <p className={styles.subtitle}>
          Masuk untuk melanjutkan pembelajaran Anda
        </p>

        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            width={18}
          />
          Masuk dengan Google
        </button>

        <div className={styles.divider}>
          <span>atau masuk dengan email</span>
        </div>

        <form className={styles.form} onSubmit={handleEmailLogin}>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
          <p className={styles.footerText}>
            Belum punya akun? <a href="/signup">Daftar sekarang</a>
          </p>
        </form>
      </div>
    </div>
  );
}
