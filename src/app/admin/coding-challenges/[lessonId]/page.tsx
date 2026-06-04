import { createClient } from '@/utils/supabase/server'
import styles from '../../admin.module.css'
import Link from 'next/link'
import ChallengeEditor from './ChallengeEditor'

export default async function CodingChallengePage({ params }: { params: { lessonId: string } }) {
  const { lessonId } = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, module_id(subject_id, title)')
    .eq('id', lessonId)
    .single()

  if (!lesson) return <div>Lesson tidak ditemukan</div>

  const { data: challenge } = await supabase
    .from('coding_challenges')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  let testCases: any[] = []
  if (challenge) {
    const { data } = await supabase
      .from('test_cases')
      .select('*')
      .eq('challenge_id', challenge.id)
      .order('order_index')
    testCases = data || []
  }

  const subjectId = (lesson.module_id as any).subject_id

  return (
    <div>
      <Link href={`/admin/subjects/${subjectId}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
        ← Kembali ke Mata Pelajaran
      </Link>
      <h1 className={styles.pageTitle} style={{ marginTop: '20px' }}>
        💻 Editor Soal Coding
      </h1>
      <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
        Lesson: <strong>{lesson.title}</strong>
      </p>

      <ChallengeEditor
        lessonId={lessonId}
        existingChallenge={challenge}
        existingTestCases={testCases}
      />
    </div>
  )
}
