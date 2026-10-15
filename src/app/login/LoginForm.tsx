"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { minasEmail } from "@/lib/minas";
import styles from "./login.module.css";

export type LoginMode = "umum" | "minas";

// Dipakai /login (tab Email/Google) dan /minas (tab Siswa MINAS langsung terbuka).
export default function LoginForm({ initialMode }: { initialMode: LoginMode }) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Sesi masih aktif: langsung ke dashboard tanpa login ulang.
  // (Google One Tap dinonaktifkan sementara: OAuth client ID-nya belum terdaftar.)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/dashboard";
    });
  }, [supabase]);

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setError(null);
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: mode === "minas" ? minasEmail(username) : email,
      password,
    });
    if (error) {
      setError(
        mode === "minas"
          ? "Username atau password salah. Tanyakan ke gurumu jika lupa."
          : error.message,
      );
    } else window.location.href = "/dashboard";
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const passwordField = (
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
  );

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

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "umum"}
            className={`${styles.tab} ${mode === "umum" ? styles.tabActive : ""}`}
            onClick={() => switchMode("umum")}
          >
            Email / Google
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "minas"}
            className={`${styles.tab} ${mode === "minas" ? styles.tabActive : ""}`}
            onClick={() => switchMode("minas")}
          >
            Siswa MINAS
          </button>
        </div>

        {mode === "umum" ? (
          <>
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

            <form className={styles.form} onSubmit={handleLogin}>
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
              {passwordField}

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
          </>
        ) : (
          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="contoh: budi27"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {passwordField}

            {error && (
              <p style={{ color: "var(--primary)", fontSize: "0.875rem" }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
            <p className={styles.footerText}>
              Username dan password ada di kartu dari gurumu.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
