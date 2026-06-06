'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createModule(subjectId: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const orderIndex = parseInt(formData.get('orderIndex') as string || '0')

  const { error } = await supabase
    .from('modules')
    .insert({
      subject_id: subjectId,
      title,
      order_index: orderIndex
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/subjects/${subjectId}`)
}

export async function createLesson(moduleId: string, subjectId: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as any
  const contentUrl = formData.get('contentUrl') as string
  const orderIndex = parseInt(formData.get('orderIndex') as string || '0')

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      description,
      type,
      content_url: contentUrl,
      order_index: orderIndex
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (type === 'quiz') {
    const isDynamic = formData.get('is_dynamic') === 'true'
    const targetCategory = formData.get('target_category') as string
    const questionCount = parseInt(formData.get('question_count') as string || '10')

    const { error: quizError } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: lesson.id,
        title,
        is_dynamic: isDynamic,
        target_category: targetCategory,
        question_count: questionCount
      })

    if (quizError) throw new Error(quizError.message)
  }

  revalidatePath(`/admin/subjects/${subjectId}`)
}

export async function deleteLesson(lessonId: string, subjectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/subjects/${subjectId}`)
}

export async function reorderModules(subjectId: string, modules: any[]) {
  const supabase = await createClient()

  await Promise.all(
    modules.map((m, index) =>
      supabase
        .from('modules')
        .update({ order_index: index + 1 })
        .eq('id', m.id)
    )
  )

  revalidatePath(`/admin/subjects/${subjectId}`)
}

export async function reorderLessons(subjectId: string, lessons: any[]) {
  const supabase = await createClient()

  await Promise.all(
    lessons.map((l, index) =>
      supabase
        .from('lessons')
        .update({ order_index: index + 1 })
        .eq('id', l.id)
    )
  )

  revalidatePath(`/admin/subjects/${subjectId}`)
}
export async function updateModule(moduleId: string, subjectId: string, title: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('modules')
    .update({ title })
    .eq('id', moduleId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/subjects/${subjectId}`)
}
export async function updateLesson(lessonId: string, subjectId: string, title: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lessons')
    .update({ title })
    .eq('id', lessonId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/subjects/${subjectId}`)
}

export async function deleteModule(moduleId: string, subjectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/subjects/${subjectId}`)
}
