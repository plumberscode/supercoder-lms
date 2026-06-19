import { createClient } from '@/utils/supabase/server'
import styles from '../admin.module.css'
import Link from 'next/link'

export default async function GradebookPage({
  searchParams
}: {
  searchParams: Promise<{ subject_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all active subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, title')
    .order('order_index')

  let modules: any[] = []
  let lessons: any[] = []
  let students: any[] = []
  let scoresMap: Record<string, Record<string, number>> = {}

  if (params.subject_id) {
    // Fetch modules
    const { data: mods } = await supabase
      .from('modules')
      .select('id, title, order_index')
      .eq('subject_id', params.subject_id)
      .order('order_index')
    modules = mods || []

    if (modules.length > 0) {
      const moduleIds = modules.map(m => m.id)
      
      // Fetch lessons
      const { data: less } = await supabase
        .from('lessons')
        .select('id, title, module_id, type, order_index')
        .in('module_id', moduleIds)
        .order('order_index')
      lessons = less || []

      // Fetch all students
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .order('full_name')
      students = allStudents || []

      if (lessons.length > 0 && students.length > 0) {
        const lessonIds = lessons.map(l => l.id)
        
        // Fetch submissions
        const { data: submissions } = await supabase
          .from('submissions')
          .select('student_id, content_id, score')
          .in('content_id', lessonIds)

        if (submissions) {
          submissions.forEach(sub => {
            if (!scoresMap[sub.student_id]) {
              scoresMap[sub.student_id] = {}
            }
            if (sub.score !== null) {
              const currentMax = scoresMap[sub.student_id][sub.content_id] || 0
              scoresMap[sub.student_id][sub.content_id] = Math.max(currentMax, sub.score)
            }
          })
        }
      }
    }
  }

  // Organize lessons by module for table headers
  const orderedLessons = modules.flatMap(mod => 
    lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index)
  )

  return (
    <div>
      <h1 className={styles.pageTitle}>📊 Buku Nilai (Gradebook)</h1>
      <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
        Pilih mata pelajaran untuk melihat rekapitulasi nilai seluruh siswa.
      </p>

      <div className="card" style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.875rem', fontWeight: 600 }}>Pilih Mata Pelajaran</label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {subjects?.map(sub => (
            <Link 
              key={sub.id} 
              href={`/admin/gradebook?subject_id=${sub.id}`}
              className={`btn ${params.subject_id === sub.id ? 'btn-primary' : ''}`}
              style={{ 
                backgroundColor: params.subject_id !== sub.id ? '#F1F5F9' : undefined, 
                color: params.subject_id !== sub.id ? '#334155' : undefined 
              }}
            >
              {sub.title}
            </Link>
          ))}
        </div>
      </div>

      {params.subject_id && orderedLessons.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--secondary)', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 2, minWidth: '250px' }}>
                  Siswa
                </th>
                {orderedLessons.map(lesson => (
                  <th key={lesson.id} style={{ padding: '16px', fontWeight: 600, color: 'var(--secondary)', minWidth: '150px', borderLeft: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {modules.find(m => m.id === lesson.module_id)?.title}
                    </div>
                    <div>{lesson.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>
                      {lesson.type.toUpperCase()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{student.full_name || 'Tanpa Nama'}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{student.email}</div>
                  </td>
                  {orderedLessons.map(lesson => {
                    const score = scoresMap[student.id]?.[lesson.id]
                    return (
                      <td key={lesson.id} style={{ padding: '16px', borderLeft: '1px solid var(--border)', textAlign: 'center' }}>
                        {score !== undefined ? (
                          <span className="badge" style={{ 
                            backgroundColor: score >= 70 ? '#DCFCE7' : '#FEF3C7', 
                            color: score >= 70 ? '#166534' : '#92400E',
                            fontSize: '1rem',
                            padding: '4px 12px'
                          }}>
                            {score}
                          </span>
                        ) : (
                          <span style={{ color: '#CBD5E1' }}>-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={orderedLessons.length + 1} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada siswa yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {params.subject_id && orderedLessons.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Mata pelajaran ini belum memiliki materi.
        </div>
      )}
    </div>
  )
}
