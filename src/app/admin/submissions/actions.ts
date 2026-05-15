'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function gradeSubmission(submissionId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const score = parseInt(formData.get('score') as string)
  const feedback = formData.get('feedback') as string
  const studentId = formData.get('studentId') as string

  const { error } = await supabase
    .from('submissions')
    .update({
      score,
      feedback,
      status: 'graded',
      graded_by: user.id,
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId)

  if (error) throw new Error(error.message)

  // Award XP for project completion
  if (score >= 70) {
    await supabase.rpc('increment_xp', { user_id: studentId, amount: 100 })
  }
  
  revalidatePath('/admin/submissions')
}
