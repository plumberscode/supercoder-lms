'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitLessonScore(formData: FormData) {
  const supabase = await createClient()

  const lessonId = formData.get('lessonId') as string
  const studentId = formData.get('studentId') as string
  const score = parseInt(formData.get('score') as string)
  const feedback = formData.get('feedback') as string

  if (!lessonId || !studentId || isNaN(score)) {
    throw new Error('Data tidak lengkap')
  }

  // Cek apakah sudah ada nilai sebelumnya untuk lesson ini oleh student ini
  const { data: existing } = await supabase
    .from('submissions')
    .select('id, score')
    .eq('student_id', studentId)
    .eq('content_id', lessonId)
    .eq('type', 'lesson')
    .maybeSingle()

  if (existing) {
    // Update
    const { error } = await supabase
      .from('submissions')
      .update({
        score,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating score:', error)
      throw new Error('Gagal memperbarui nilai')
    }

    const oldScore = existing.score || 0
    const xpDiff = score - oldScore
    if (xpDiff !== 0) {
      const { error: rpcError } = await supabase.rpc('increment_xp', { user_id: studentId, amount: xpDiff })
      if (rpcError) console.error('Error incrementing XP diff:', rpcError)
    }
  } else {
    // Insert
    const { error } = await supabase
      .from('submissions')
      .insert({
        student_id: studentId,
        content_id: lessonId,
        type: 'lesson',
        data: {}, // No specific submission data
        score,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
        submitted_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting score:', error)
      throw new Error(`Gagal menyimpan nilai baru: ${error.message} (${error.details || ''})`)
    }

    if (score > 0) {
      const { error: rpcError } = await supabase.rpc('increment_xp', { user_id: studentId, amount: score })
      if (rpcError) console.error('Error incrementing XP:', rpcError)
    }
  }

  revalidatePath('/admin/lesson-scores')
  revalidatePath(`/lessons/${lessonId}`)
  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
}
