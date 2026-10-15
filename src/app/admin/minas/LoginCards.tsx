"use client";

import { SITE_URL } from "@/lib/site";
import type { MinasCredential } from "./actions";
import styles from "./minas.module.css";

const LOGIN_URL = `${SITE_URL.replace(/^https?:\/\//, "")}/minas`;

// Password hanya bisa dilihat sekali (saat dibuat/di-reset), jadi kartu ini
// sebaiknya langsung dicetak atau difoto.
export default function LoginCards({
  credentials,
  title,
}: {
  credentials: MinasCredential[];
  title: string;
}) {
  if (credentials.length === 0) return null;

  return (
    <div className={`card ${styles.printArea}`} style={{ marginBottom: "24px" }}>
      <div
        className={styles.noPrint}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p style={{ margin: "4px 0 0", color: "#B45309", fontSize: "0.875rem" }}>
            Password hanya tampil sekarang. Cetak atau simpan sebelum menutup halaman ini.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          🖨️ Cetak Kartu
        </button>
      </div>

      <div className={styles.cardGrid}>
        {credentials.map((c) => (
          <div key={c.username} className={styles.loginCard}>
            <div className={styles.cardBrand}>Supercoder × MINAS</div>
            <div className={styles.cardName}>{c.fullName}</div>
            <div className={styles.cardRow}>
              <span>Username</span>
              <strong>{c.username}</strong>
            </div>
            <div className={styles.cardRow}>
              <span>Password</span>
              <strong>{c.password}</strong>
            </div>
            <div className={styles.cardUrl}>Masuk di {LOGIN_URL}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
