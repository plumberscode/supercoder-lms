import { createClient } from '@/utils/supabase/server'
import styles from '../admin.module.css'
import Link from 'next/link'
import { createSubject } from './actions'
import SubjectList from './SubjectList'


export default async function AdminSubjectsPage() {
  const supabase = await createClient()

  let { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Falling back to created_at sorting:', error.message)
    const { data: fallbackData } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false })
    subjects = fallbackData
  }


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Mata Pelajaran</h1>
        
        {/* Create Subject Modal/Form toggle could go here, for now simple form */}
        <details className="card" style={{ width: 'auto' }}>
          <summary className="btn btn-primary" style={{ listStyle: 'none', cursor: 'pointer' }}>+ Buat Mata Pelajaran Baru</summary>
          <form action={createSubject} className="form" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.inputGroup}>
              <label>Judul</label>
              <input name="title" type="text" placeholder="Contoh: Dasar-dasar React" required />
            </div>
            <div className={styles.inputGroup}>
              <label>Deskripsi</label>
              <textarea name="description" placeholder="Jelaskan apa yang akan dipelajari..." required />
            </div>
            <button type="submit" className="btn btn-primary">Simpan Mata Pelajaran</button>
          </form>
        </details>
      </div>

      <SubjectList initialSubjects={subjects || []} />

    </div>
  )
}
