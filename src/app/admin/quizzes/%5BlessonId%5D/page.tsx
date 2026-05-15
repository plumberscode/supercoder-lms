import { createClient } from '@/utils/supabase/server'
import styles from '../../admin.module.css'
import { addQuestion, deleteQuestion } from '../actions'
import Link from 'next/link'

export default async function QuizManagementPage({ params }: { params: { lessonId: string } }) {
  const { lessonId } = await params
  const supabase = await createClient()

  // 1. Get lesson details
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, module_id(subject_id)')
    .eq('id', lessonId)
    .single()

  if (!lesson) return <div>Lesson not found</div>

  // 2. Ensure quiz record exists
  let { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .single()

  if (!quiz) {
    const { data: newQuiz, error: createError } = await supabase
      .from('quizzes')
      .insert({ lesson_id: lessonId, title: lesson.title })
      .select()
      .single()
    
    if (createError) return <div>Error creating quiz: {createError.message}</div>
    quiz = newQuiz
  }

  // 3. Get questions
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)

  const subjectId = (lesson.module_id as any).subject_id

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/subjects/${subjectId}`} style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
          ← Back to Subject
        </Link>
        <h1 className={styles.pageTitle} style={{ marginTop: '12px' }}>Manage Quiz: {lesson.title}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        {/* Questions List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Questions ({questions?.length || 0})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions?.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#64748B' }}>
                No questions yet. Add your first one!
              </div>
            ) : (
              questions?.map((q, idx) => (
                <div key={q.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Q{idx + 1}</span>
                    <form action={deleteQuestion.bind(null, q.id, lessonId)}>
                      <button style={{ background: 'none', cursor: 'pointer' }}>🗑️</button>
                    </form>
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: '16px' }}>{q.question_text}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {q.options.map((opt: string, i: number) => (
                      <div key={i} style={{ 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        fontSize: '0.875rem',
                        backgroundColor: i === q.correct_option_index ? '#DCFCE7' : '#F1F5F9',
                        color: i === q.correct_option_index ? '#166534' : '#475569',
                        border: i === q.correct_option_index ? '1px solid #BBF7D0' : '1px solid transparent'
                      }}>
                        {opt} {i === q.correct_option_index && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Question Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Add Question</h2>
          <form action={addQuestion.bind(null, quiz.id)} className="form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.inputGroup}>
              <label>Question Text</label>
              <textarea name="questionText" placeholder="e.g. What is a React component?" required rows={3}></textarea>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.inputGroup}>
                <label>Option 1</label>
                <input name="option1" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Option 2</label>
                <input name="option2" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Option 3</label>
                <input name="option3" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Option 4</label>
                <input name="option4" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Correct Answer</label>
              <select name="correctIndex" required style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">Add Question</button>
          </form>
        </div>
      </div>
    </div>
  )
}
