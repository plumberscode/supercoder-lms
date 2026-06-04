'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAIHint } from '@/lib/ai-hints'

export async function submitCodeSolution(params: {
  challengeId: string
  lessonId: string
  code: string
  score: number
  html?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('submissions')
    .select('id, score')
    .eq('student_id', user.id)
    .eq('content_id', params.lessonId)
    .eq('type', 'code')
    .maybeSingle()

  if (existing) {
    if (params.score > (existing.score || 0)) {
      const { error } = await supabase.from('submissions').update({
        data: { code: params.code, ...(params.html !== undefined && { html: params.html }) },
        score: params.score,
        status: 'graded',
        graded_at: new Date().toISOString()
      }).eq('id', existing.id)
      if (error) throw new Error('Gagal memperbarui: ' + error.message)
    }
  } else {
    const { error } = await supabase.from('submissions').insert({
      student_id: user.id,
      content_id: params.lessonId,
      type: 'code',
      data: { code: params.code, ...(params.html !== undefined && { html: params.html }) },
      score: params.score,
      status: 'graded',
      submitted_at: new Date().toISOString(),
      graded_at: new Date().toISOString()
    })
    if (error) throw new Error('Gagal menyimpan: ' + error.message)
  }

  revalidatePath(`/lessons/${params.lessonId}`)
  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getCodeHint(params: {
  challengeDescription: string
  language: string
  studentCode: string
  testResults: { title: string; passed: boolean; expected: string; actual: string }[]
  attemptNumber: number
}): Promise<string> {
  return getAIHint(params)
}
