import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') {
    redirect('/pending-approval')
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)

  return (
    <div className="container">
      <div className={styles.dashboardGrid}>
        {/* Welcome Header */}
        <div className={styles.welcomeCard}>
          <div>
            <h1>Halo, {profile.full_name || user.email?.split('@')[0]}! 👋</h1>
            <p>Siap untuk meningkatkan skill coding Anda hari ini?</p>
            {(profile.role === 'admin' || profile.role === 'teacher') && (
              <Link href="/admin/users" className="btn btn-primary" style={{ marginTop: '16px', padding: '8px 16px', fontSize: '0.875rem' }}>
                Buka Panel Admin ⚙️
              </Link>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '4px' }}>LEVEL SAAT INI</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>Lvl {profile.level}</div>
            <form action={signOut} style={{ marginTop: '12px' }}>
              <button type="submit" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                Log Out 🚪
              </button>
            </form>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`${styles.statCard} card`}>
          <div>
            <h3 style={{ marginBottom: '24px' }}>Progres Saya</h3>
            <div className={styles.xpCircle}>
              {profile.xp}
            </div>
            <p style={{ fontWeight: 600 }}>{profile.xp} XP Didapat</p>
            <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Selesaikan kuis untuk dapat lebih banyak!</p>
          </div>
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <Link href="/leaderboard" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              Lihat Papan Peringkat →
            </Link>
          </div>
        </div>

        {/* Subjects Section */}
        <div className={styles.subjectGrid}>
          {subjects?.map((subject) => (
            <Link href={`/subjects/${subject.id}`} key={subject.id} className={styles.subjectCard}>
              <div className={styles.subjectIcon}>💻</div>
              <div>
                <h3 style={{ marginBottom: '8px' }}>{subject.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {subject.description}
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-xp">Coding</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Mulai Belajar →</span>
              </div>
            </Link>
          ))}
          {subjects?.length === 0 && (
            <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#64748B' }}>Belum ada materi tersedia. Cek lagi nanti ya!</p>
            </div>
          )}
        </div>

        {/* Achievements / Notifications */}
        <div className={`${styles.leaderboardCard} card`}>
          <h3 style={{ marginBottom: '20px' }}>Lencana Terbaru</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }} title="Pemula">
              🌱
            </div>
          </div>
          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: '#64748B' }}>
            Buka lebih banyak lencana dengan menyelesaikan modul!
          </p>
        </div>
      </div>
    </div>
  )
}
