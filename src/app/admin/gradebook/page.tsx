import { createClient } from '@/utils/supabase/server'
import styles from '../admin.module.css'
import Link from 'next/link'

export default async function GradebookPage({
  searchParams
}: {
  searchParams: Promise<{ subject_id?: string; student_id?: string }>
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
  // Map: student_id -> lesson_id -> max score
  let allScoresMap: Record<string, Record<string, number>> = {}
  // Detail for selected student: lesson_id -> max score
  let selectedStudentScores: Record<string, number> = {}

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

      if (lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id)

        // Single query: all submissions for all students for this subject
        // Filter by relevant types to prevent score mixing between different submission types
        const { data: submissions } = await supabase
          .from('submissions')
          .select('student_id, content_id, score, type')
          .in('content_id', lessonIds)
          .in('type', ['code', 'css', 'quiz', 'lesson'])

        if (submissions) {
          submissions.forEach(sub => {
            if (sub.score === null) return
            if (!allScoresMap[sub.student_id]) allScoresMap[sub.student_id] = {}
            const cur = allScoresMap[sub.student_id][sub.content_id] || 0
            allScoresMap[sub.student_id][sub.content_id] = Math.max(cur, sub.score)
          })
        }

        if (params.student_id) {
          selectedStudentScores = allScoresMap[params.student_id] || {}
        }
      }
    }
  }

  const totalLessons = lessons.length

  // Lessons grouped by module for the detail panel
  const lessonsByModule = modules.map(mod => ({
    ...mod,
    lessons: lessons
      .filter(l => l.module_id === mod.id)
      .sort((a, b) => a.order_index - b.order_index)
  }))

  const selectedStudent = students.find(s => s.id === params.student_id)

  const typeIcon: Record<string, string> = {
    video: '📺',
    quiz: '🧠',
    code: '💻',
    css: '🎨',
    html: '🌐',
    project: '🗂️',
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>📊 Buku Nilai (Gradebook)</h1>

      {/* Subject Filter */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.875rem', fontWeight: 600 }}>
          Pilih Mata Pelajaran
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

      {/* 2-Panel Layout */}
      {params.subject_id && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* LEFT PANEL — Student List */}
          <div className="card" style={{ padding: '8px' }}>
            <div style={{ padding: '12px 16px', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daftar Murid ({students.length})
            </div>

            {students.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Belum ada siswa terdaftar.
              </div>
            )}

            {students.map(student => {
              const studentScores = allScoresMap[student.id] || {}
              const doneCount = lessons.filter(l => (studentScores[l.id] ?? -1) >= 70).length
              const progressPct = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0
              const isSelected = params.student_id === student.id

              return (
                <Link
                  key={student.id}
                  href={`/admin/gradebook?subject_id=${params.subject_id}&student_id=${student.id}`}
                  style={{
                    display: 'block',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    marginBottom: '2px',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                    {student.full_name || 'Tanpa Nama'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {student.email}
                  </div>
                  {/* Mini Progress Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '5px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        backgroundColor: progressPct === 100 ? '#10B981' : 'var(--primary)',
                        borderRadius: '99px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {doneCount}/{totalLessons}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* RIGHT PANEL — Student Detail */}
          <div>
            {!params.student_id ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>👈</div>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Pilih murid dari daftar di kiri</div>
                <div style={{ fontSize: '0.875rem' }}>Detail progres dan nilai murid akan ditampilkan di sini.</div>
              </div>
            ) : (
              <div>
                {/* Student Header */}
                <div className="card" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--secondary)' }}>
                      {selectedStudent?.full_name || 'Tanpa Nama'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedStudent?.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {(() => {
                      const doneCount = lessons.filter(l => (selectedStudentScores[l.id] ?? -1) >= 70).length
                      const progressPct = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0
                      return (
                        <>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{progressPct}%</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doneCount} dari {totalLessons} soal selesai</div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Lessons by Module */}
                {lessonsByModule.map(mod => (
                  <div key={mod.id} className="card" style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                        {mod.order_index}
                      </span>
                      {mod.title}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {mod.lessons.length === 0 && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                          Belum ada materi di modul ini.
                        </div>
                      )}
                      {mod.lessons.map((lesson: any) => {
                        const score = selectedStudentScores[lesson.id]
                        const done = score !== undefined && score >= 70
                        const attempted = score !== undefined && score < 70

                        return (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: done ? '#F0FDF4' : attempted ? '#FFFBEB' : '#F8FAFC',
                              border: `1px solid ${done ? '#BBF7D0' : attempted ? '#FDE68A' : '#E2E8F0'}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '1.25rem' }}>
                                {done ? '✅' : attempted ? '⚠️' : '⬜'}
                              </span>
                              <span style={{ fontSize: '1rem' }}>{typeIcon[lesson.type] || '📄'}</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                  {lesson.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {lesson.type.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              {done && (
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#16A34A' }}>{score}</span>
                              )}
                              {attempted && (
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#D97706' }}>{score}</span>
                              )}
                              {!done && !attempted && (
                                <span style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>Belum dikerjakan</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
