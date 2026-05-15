'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addQuestion(quizId: string, formData: FormData) {
  const supabase = await createClient()
  
  const questionText = formData.get('questionText') as string
  const option1 = formData.get('option1') as string
  const option2 = formData.get('option2') as string
  const option3 = formData.get('option3') as string
  const option4 = formData.get('option4') as string
  const correctIndex = parseInt(formData.get('correctIndex') as string)
  const points = parseInt(formData.get('points') as string || '10')

  const { error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: quizId,
      question_text: questionText,
      options: [option1, option2, option3, option4],
      correct_option_index: correctIndex,
      points: points
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/quizzes/${quizId}`)
}

export async function deleteQuestion(questionId: string, lessonId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/quizzes/${lessonId}`)
}
