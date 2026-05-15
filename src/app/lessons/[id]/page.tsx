import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import QuizView from './quiz-view'
import ProjectSubmission from './project-submission'

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, module_id(subject_id, title)')
    .eq('id', id)
    .single()

  if (!lesson) return <div>Materi tidak ditemukan</div>

  const subjectId = (lesson.module_id as any).subject_id

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border)', padding: '16px 40px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/subjects/${subjectId}`} style={{ fontWeight: 600, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← {(lesson.module_id as any).title}
          </Link>
          <div style={{ fontWeight: 800, color: 'var(--primary)' }}>Supercoder</div>
        </div>
      </header>

      <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', marginBottom: '32px' }}>{lesson.title}</h1>

        <div className="card" style={{ marginBottom: '40px' }}>
          {/* Material Viewer */}
          {lesson.type === 'video' && (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', backgroundColor: 'black' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={lesson.content_url?.replace('watch?v=', 'embed/')}
                title="Lesson Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {lesson.type === 'pdf' && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', marginBottom: '16px', display: 'block' }}>📄</span>
              <h3>Materi Pembelajaran (PDF)</h3>
              <p style={{ color: '#64748B', marginBottom: '24px' }}>Silakan tinjau dokumen di bawah ini untuk melanjutkan.</p>
              <a href={lesson.content_url} target="_blank" className="btn btn-primary">Buka PDF</a>
            </div>
          )}

          {lesson.type === 'link' && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', marginBottom: '16px', display: 'block' }}>🔗</span>
              <h3>Sumber Eksternal</h3>
              <p style={{ color: '#64748B', marginBottom: '24px' }}>Ikuti link di bawah ini untuk mengakses materi pembelajaran.</p>
              <a href={lesson.content_url} target="_blank" className="btn btn-primary">Buka Link</a>
            </div>
          )}

          {lesson.type === 'text' && (
            <div style={{ padding: '20px', lineHeight: 1.8 }}>
              <p>{lesson.content_url || 'Konten teks akan muncul di sini.'}</p>
            </div>
          )}

          {lesson.type === 'quiz' && (
             <QuizView lessonId={lesson.id} />
          )}
        </div>

        {/* Project Submission Area */}
        {lesson.is_project_required && (
          <ProjectSubmission lessonId={lesson.id} />
        )}
      </div>
    </div>
  )
}
