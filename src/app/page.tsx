import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.hero}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          Super<span>coder</span>
        </div>
        <div>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
            Masuk
          </Link>
        </div>
      </nav>

      <div className={styles.badge}>🚀 TINGKATKAN SKILL CODING ANDA</div>
      <h1 className={styles.title}>
        Belajar membangun aplikasi <span>nyata</span> dari nol.
      </h1>
      <p className={styles.subtitle}>
        Platform pembelajaran terbaik untuk generasi Supercoder masa depan. 
        Pantau progres Anda, kumpulkan XP, dan jadilah yang terbaik.
      </p>

      <div className={styles.ctaGroup}>
        <Link href="/login" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.125rem' }}>
          Mulai Sekarang
        </Link>
        <Link href="/login" className="btn btn-secondary" style={{ padding: '16px 40px', fontSize: '1.125rem', backgroundColor: 'white', color: 'var(--secondary)', border: '1px solid var(--border)' }}>
          Lihat Kursus
        </Link>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🎯</div>
          <h3>Belajar Sambil Bermain</h3>
          <p style={{ color: '#64748B', fontSize: '0.9375rem', marginTop: '8px' }}>
            Dapatkan XP dan naik level setiap kali Anda menyelesaikan kuis dan proyek.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>👨‍🏫</div>
          <h3>Masukan dari Ahli</h3>
          <p style={{ color: '#64748B', fontSize: '0.9375rem', marginTop: '8px' }}>
            Kirim proyek Anda dan dapatkan ulasan langsung dari instruktur kami.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📈</div>
          <h3>Papan Peringkat</h3>
          <p style={{ color: '#64748B', fontSize: '0.9375rem', marginTop: '8px' }}>
            Bersaing dengan siswa lain dan raih peringkat tertinggi di Supercoder.
          </p>
        </div>
      </div>

      <footer style={{ marginTop: '100px', color: '#94A3B8', fontSize: '0.875rem' }}>
        © 2026 Supercoder Coding Class. Hak Cipta Dilindungi Undang-Undang.
      </footer>
    </main>
  )
}
