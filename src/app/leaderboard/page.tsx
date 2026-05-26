import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: topStudents } = await supabase
    .from('profiles')
    .select('full_name, email, xp, level')
    .eq('status', 'approved')
    .order('xp', { ascending: false })
    .limit(10)

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '700px' }}>
      <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 600 }}>
        ← Kembali ke Dashboard
      </Link>
      
      <div style={{ textAlign: 'center', marginTop: '32px', marginBottom: '48px' }}>
        <span style={{ fontSize: '3rem' }}>🏆</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '16px' }}>Papan Peringkat</h1>
        <p style={{ color: '#64748B' }}>Lihat siapa yang memimpin di Supercoder!</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {topStudents?.map((student, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            padding: '20px 32px',
            borderBottom: idx === topStudents.length - 1 ? 'none' : '1px solid var(--border)',
            backgroundColor: idx === 0 ? '#FEFCE8' : 'transparent'
          }}>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              width: '32px',
              color: idx === 0 ? '#CA8A04' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#CBD5E1'
            }}>
              #{idx + 1}
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {student.full_name?.[0] || student.email[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{student.full_name || student.email.split('@')[0]}</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Level {student.level}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{student.xp}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>XP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
