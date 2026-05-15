'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addQuestion(formData: FormData) {
  const supabase = await createClient()
  
  const subject_id = formData.get('subject_id') as string
  const category = formData.get('category') as string
  const question_text = formData.get('question_text') as string
  const options = JSON.parse(formData.get('options') as string)
  const correct_option_index = parseInt(formData.get('correct_option_index') as string)
  const points = parseInt(formData.get('points') as string || '10')

  const { error } = await supabase
    .from('question_bank')
    .insert({
      subject_id,
      category,
      question_text,
      options,
      correct_option_index,
      points
    })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/question-bank')
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('question_bank')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/question-bank')
}

export async function updateQuestion(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const category = formData.get('category') as string
  const question_text = formData.get('question_text') as string
  const options = JSON.parse(formData.get('options') as string)
  const correct_option_index = parseInt(formData.get('correct_option_index') as string)
  const points = parseInt(formData.get('points') as string || '10')

  const { error } = await supabase
    .from('question_bank')
    .update({
      category,
      question_text,
      options,
      correct_option_index,
      points
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/question-bank')
}

export async function bulkAddQuestions(questions: any[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('question_bank')
    .insert(questions)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/question-bank')
}
