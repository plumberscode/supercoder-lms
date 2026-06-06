import { createClient } from '@/utils/supabase/server'
import styles from '../../admin.module.css'
import { createModule, createLesson, deleteLesson } from './actions'
import Link from 'next/link'
import LessonForm from './LessonForm'
import ModuleList from './ModuleList'


export default async function SubjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select(`
      *,
      modules (
        *,
        lessons (*)
      )
    `)
    .eq('id', id)
    .single()

  if (!subject) return <div>Mata Pelajaran tidak ditemukan</div>

  return (
    <div>
      <Link href="/admin/subjects" style={{ color: 'var(--primary)', fontWeight: 600 }}>
        ← Kembali ke Mata Pelajaran
      </Link>
      <h1 className={styles.pageTitle} style={{ marginTop: '20px' }}>{subject.title}</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ModuleList 
            initialModules={
              subject.modules
                ?.sort((a: any, b: any) => a.order_index - b.order_index)
                .map((m: any) => ({
                  ...m,
                  lessons: m.lessons?.sort((a: any, b: any) => a.order_index - b.order_index) || []
                })) || []
            } 
            subjectId={id} 
          />


          {/* Add Module Form */}
          <div className="card" style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}>
            <h3 style={{ marginBottom: '16px' }}>+ Tambah Modul Baru</h3>
            <form action={createModule.bind(null, id)} className="form" style={{ display: 'flex', gap: '12px' }}>
              <input name="title" type="text" placeholder="Judul Modul" required style={{ flex: 1 }} />
              <input name="orderIndex" type="hidden" value={subject.modules.length + 1} />
              <button type="submit" className="btn btn-primary">Simpan Modul</button>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '16px' }}>Statistik Mata Pelajaran</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Modul</span>
                <span style={{ fontWeight: 700 }}>{subject.modules.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Materi</span>
                <span style={{ fontWeight: 700 }}>{subject.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
