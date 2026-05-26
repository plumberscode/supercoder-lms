import Link from 'next/link'
import styles from './admin.module.css'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          Super<span>coder</span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/admin/users" className={`${styles.navLink}`}>
            <span>👥</span> Pengguna
          </Link>
          <Link href="/admin/subjects" className={styles.navLink}>
            <span>📚</span> Mata Pelajaran
          </Link>
          <Link href="/admin/submissions" className={styles.navLink}>
            <span>📝</span> Tugas & Proyek
          </Link>
          <Link href="/admin/lesson-scores" className={styles.navLink}>
            <span>💯</span> Penilaian Materi
          </Link>
          <Link href="/admin/question-bank" className={styles.navLink}>
            <span>🧠</span> Bank Soal
          </Link>
          <Link href="/admin/notifications" className={styles.navLink}>
            <span>🔔</span> Notifikasi
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link href="/dashboard" className={styles.navLink}>
            <span>🏠</span> Tampilan Siswa
          </Link>
          <form action={signOut}>
            <button type="submit" className={styles.logoutBtn}>
              <span>🚪</span> Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 500, color: 'var(--secondary)' }}>{user.email}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn-logout" style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Keluar 🚪
              </button>
            </form>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
