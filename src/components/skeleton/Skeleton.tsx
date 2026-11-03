import type { CSSProperties } from "react";
import ui from "@/components/student/student.module.css";
import styles from "./Skeleton.module.css";

interface BoneProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  circle?: boolean;
  style?: CSSProperties;
}

/** Satu blok skeleton berkilau. */
export function Bone({ width = "100%", height = 14, circle, style }: BoneProps) {
  return (
    <span
      className={`${styles.bone} ${circle ? styles.circle : ""}`}
      style={{ width, height, flexShrink: 0, ...style }}
    />
  );
}

/** Isi area konten admin (sidebar & topbar tetap tampil dari layout). */
export function AdminPageSkeleton() {
  return (
    <div className={styles.adminStack} role="status" aria-label="Memuat halaman">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Bone width={260} height={30} />
        <Bone width={380} height={14} style={{ maxWidth: "100%" }} />
      </div>

      <div className={styles.adminStats}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={styles.adminCard}>
            <Bone width="50%" height={12} />
            <Bone width="35%" height={26} />
          </div>
        ))}
      </div>

      <div className={styles.adminCard}>
        <Bone width={200} height={18} />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles.adminRow}>
            <Bone width={36} height={36} circle />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Bone width="40%" height={13} />
              <Bone width="25%" height={11} />
            </div>
            <Bone width={80} height={26} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentTopBarSkeleton() {
  return (
    <header className={ui.topBar}>
      <div className={ui.topBarContainer}>
        <Bone width={130} height={32} />
        <div className={ui.topBarRight}>
          <Bone width={80} height={32} style={{ borderRadius: 999 }} />
          <Bone width={36} height={36} circle />
        </div>
      </div>
    </header>
  );
}

function StudentHeroSkeleton() {
  return (
    <section className={ui.hero}>
      <div className={styles.heroText}>
        <Bone width={120} height={12} />
        <Bone width="60%" height={32} />
        <Bone width="80%" height={14} />
        <Bone width={170} height={44} style={{ borderRadius: 12, marginTop: 8 }} />
      </div>
      <Bone width={120} height={120} style={{ borderRadius: 24 }} />
    </section>
  );
}

function StudentListCard({ rows }: { rows: number }) {
  return (
    <div className={ui.panelCard}>
      <Bone width="45%" height={16} style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.listItem}>
          <Bone width={40} height={40} style={{ borderRadius: 12 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Bone width="70%" height={13} />
            <Bone width="40%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Halaman siswa lengkap (top bar, hero, kartu). `withPanel` menambah panel kanan
 * seperti di dashboard & mata pelajaran.
 */
export function StudentPageSkeleton({ withPanel = true }: { withPanel?: boolean }) {
  const main = (
    <div className={ui.mainColumn}>
      <StudentHeroSkeleton />
      <div className={ui.statRow}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={ui.statCard}>
            <Bone width={46} height={46} style={{ borderRadius: 14 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Bone width="60%" height={11} />
              <Bone width="40%" height={20} />
            </div>
          </div>
        ))}
      </div>
      <StudentListCard rows={4} />
    </div>
  );

  return (
    <div className={ui.shell} role="status" aria-label="Memuat halaman">
      <StudentTopBarSkeleton />
      <main className={ui.page}>
        <div className={ui.breadcrumb}>
          <Bone width={220} height={14} />
        </div>
        {withPanel ? (
          <div className={ui.layout}>
            {main}
            <aside className={ui.rightPanel}>
              <StudentListCard rows={3} />
              <StudentListCard rows={2} />
            </aside>
          </div>
        ) : (
          main
        )}
      </main>
    </div>
  );
}
