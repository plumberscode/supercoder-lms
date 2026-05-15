import { createClient } from '@/utils/supabase/server'
import QuestionBankList from './QuestionBankList'
import QuestionForm from './QuestionForm'
import CSVImport from './CSVImport'

export default async function QuestionBankPage() {
  const supabase = await createClient()

  // Fetch subjects for the form
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, title')
    .order('title')

  // Fetch all questions with subject info
  const { data: questions } = await supabase
    .from('question_bank')
    .select(`
      *,
      subjects (
        title
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>🧠 Bank Soal</h1>
        <p style={{ color: '#64748B' }}>Kelola koleksi pertanyaan untuk kuis dinamis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'start' }}>
        <QuestionForm subjects={subjects || []} />
        <CSVImport subjects={subjects || []} />
      </div>
      
      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #E2E8F0' }} />
      
      <h2 style={{ marginBottom: '24px' }}>Daftar Soal</h2>
      <QuestionBankList initialQuestions={questions || []} />
    </div>
  )
}
