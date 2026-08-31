"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorMessage =
    searchParams.get("error") || "Unable to exchange external code";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "24px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
          maxWidth: "450px",
          width: "100%",
          textAlign: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1e293b",
            margin: "0 0 16px 0",
          }}
        >
          Autentikasi Gagal
        </h1>
        <p
          style={{
            color: "#64748b",
            lineHeight: "1.6",
            marginBottom: "24px",
          }}
        >
          Terjadi kesalahan saat mencoba masuk dengan Google. Ini biasanya
          disebabkan oleh Client Secret yang salah atau API Google yang belum
          diaktifkan.
        </p>

        <div
          style={{
            background: "#fff1f2",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "14px",
            textAlign: "left",
            marginBottom: "32px",
            border: "1px solid #ffe4e6",
            color: "#be123c",
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>
            <strong>Pesan Error:</strong> {errorMessage}
          </p>
          <p style={{ margin: 0 }}>
            Pastikan <strong>Google People API</strong> sudah aktif dan Client
            Secret di Supabase sudah benar.
          </p>
        </div>

        <Link
          href="/login"
          style={{
            display: "inline-block",
            background: "#0066FF",
            color: "white",
            padding: "12px 32px",
            borderRadius: "12px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Kembali ke Halaman Login
        </Link>
      </div>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
