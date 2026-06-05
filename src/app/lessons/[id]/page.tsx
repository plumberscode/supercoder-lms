import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import QuizView from './quiz-view'
import ProjectSubmission from './project-submission'
import CodeChallenge from '@/components/CodeChallenge'
import CssChallenge from '@/components/CssChallenge'

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, module_id(subject_id, title)')
    .eq('id', id)
    .single()

  if (!lesson) return <div>Materi tidak ditemukan</div>

  let lessonScore = null
  let codeSubmission = null
  let cssSubmission: { score: number; data: any } | null = null
  if (user) {
    const { data } = await supabase
      .from('submissions')
      .select('score, feedback, graded_at')
      .eq('student_id', user.id)
      .eq('content_id', id)
      .eq('type', 'lesson')
      .maybeSingle()
    if (data) lessonScore = data

    const { data: codeSub } = await supabase
      .from('submissions')
      .select('score, data')
      .eq('student_id', user.id)
      .eq('content_id', id)
      .eq('type', 'code')
      .maybeSingle()
    if (codeSub) codeSubmission = codeSub

    const { data: cssSub } = await supabase
      .from('submissions')
      .select('score, data')
      .eq('student_id', user.id)
      .eq('content_id', id)
      .eq('type', 'css')
      .maybeSingle()
    if (cssSub) cssSubmission = cssSub
  }

  // Fetch coding challenge if lesson type is 'code'
  let codingChallenge = null
  let testCases: any[] = []
  if (lesson.type === 'code') {
    const { data: challenge } = await supabase
      .from('coding_challenges')
      .select('*')
      .eq('lesson_id', id)
      .single()
    if (challenge) {
      codingChallenge = challenge
      const { data: cases } = await supabase
        .from('test_cases')
        .select('*')
        .eq('challenge_id', challenge.id)
        .order('order_index')
      testCases = cases || []
    }
  }

  // Fetch CSS challenge if lesson type is 'css-challenge'
  let cssChallenge = null
  if (lesson.type === 'css-challenge') {
    const { data: challenge } = await supabase
      .from('css_challenges')
      .select('*')
      .eq('lesson_id', id)
      .single()
    if (challenge) cssChallenge = challenge
  }

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
          {lessonScore && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ color: '#166534', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏆</span> Nilai Materi
                </h3>
                <p style={{ margin: 0, color: '#15803D', fontSize: '0.9rem' }}>
                  Dinilai pada {new Date(lessonScore.graded_at).toLocaleDateString()}
                  {lessonScore.feedback && (
                    <span style={{ display: 'block', marginTop: '8px', fontStyle: 'italic', color: '#166534' }}>
                      " {lessonScore.feedback} "
                    </span>
                  )}
                </p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534', backgroundColor: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {lessonScore.score} <span style={{ fontSize: '1rem', color: '#86EFAC', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>
          )}

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

          {lesson.type === 'code' && codingChallenge && (
            <CodeChallenge
              challenge={codingChallenge}
              testCases={testCases}
              existingSubmission={codeSubmission}
            />
          )}

          {lesson.type === 'code' && !codingChallenge && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', marginBottom: '16px', display: 'block' }}>💻</span>
              <h3>Soal Coding</h3>
              <p style={{ color: '#64748B' }}>Soal coding untuk materi ini belum dibuat oleh guru.</p>
            </div>
          )}

          {lesson.type === 'css-challenge' && cssChallenge && (
            <CssChallenge
              challenge={cssChallenge}
              existingSubmission={cssSubmission}
            />
          )}

          {lesson.type === 'css-challenge' && !cssChallenge && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', marginBottom: '16px', display: 'block' }}>🎨</span>
              <h3>CSS Challenge</h3>
              <p style={{ color: '#64748B' }}>Soal CSS untuk materi ini belum dibuat oleh guru.</p>
            </div>
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
