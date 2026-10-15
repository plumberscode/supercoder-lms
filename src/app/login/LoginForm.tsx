"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { minasEmail } from "@/lib/minas";
import styles from "./login.module.css";

export type LoginMode = "umum" | "minas";

// /login: Google + email (Supercoder & teaser). /minas: username + password.
// Sengaja dua halaman terpisah agar pengunjung umum tidak melihat login MINAS.
export default function LoginForm({ mode }: { mode: LoginMode }) {
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
          <Image
            src="/images/Logo transparent orange.webp"
            alt="Supercoder"
            width={144}
            height={48}
            className={styles.logoImage}
            priority
          />
        </div>
        <h1 className={styles.title}>
          {mode === "minas" ? "Masuk Siswa MINAS" : "Selamat Datang Kembali"}
        </h1>
        <p className={styles.subtitle}>
          {mode === "minas"
            ? "Pakai username dan password dari kartu gurumu"
            : "Masuk untuk melanjutkan pembelajaran Anda"}
        </p>

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
              Bukan siswa MINAS? <a href="/login">Masuk di sini</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
