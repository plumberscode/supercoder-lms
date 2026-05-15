import { createClient } from '@/utils/supabase/server'
import styles from '../admin.module.css'
import { gradeSubmission } from './actions'

export default async function SubmissionsPage() {
  const supabase = await createClient()

  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles!student_id(full_name, email)
    `)
    .eq('type', 'project')
    .order('submitted_at', { ascending: false })

  if (error) return <div>Gagal memuat kiriman: {error.message}</div>

  return (
    <div>
      <h1 className={styles.pageTitle}>Kiriman Proyek Siswa</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {submissions?.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#64748B' }}>
            Belum ada kiriman proyek untuk diperiksa.
          </div>
        )}

        {submissions?.map((sub) => (
          <div key={sub.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span className="badge" style={{ backgroundColor: sub.status === 'graded' ? '#DCFCE7' : '#FEF3C7', color: sub.status === 'graded' ? '#166534' : '#92400E' }}>
                  {sub.status === 'graded' ? 'SUDAH DINILAI' : 'MENUNGGU'}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#94A3B8' }}>{new Date(sub.submitted_at).toLocaleDateString()}</span>
              </div>
              <h3 style={{ marginBottom: '4px' }}>{(sub as any).profiles.full_name || (sub as any).profiles.email}</h3>
              <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '24px' }}>Telah mengirimkan proyek untuk ditinjau.</p>
              
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '8px' }}>LINK PROYEK:</p>
                <a href={sub.data.link} target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, wordBreak: 'break-all' }}>
                  {sub.data.link} 🔗
                </a>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '40px' }}>
              <h4 style={{ marginBottom: '20px' }}>Nilai & Masukan</h4>
              <form action={gradeSubmission.bind(null, sub.id)} className="form">
                <input type="hidden" name="studentId" value={sub.student_id} />
                <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
                  <label>Skor (0-100)</label>
                  <input name="score" type="number" defaultValue={sub.score || ''} min="0" max="100" required />
                </div>
                <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
                  <label>Masukan / Feedback</label>
                  <textarea name="feedback" defaultValue={sub.feedback || ''} rows={3} placeholder="Bagus sekali! Selanjutnya coba untuk..."></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {sub.status === 'graded' ? 'Perbarui Nilai' : 'Simpan Nilai'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
