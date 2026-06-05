'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCssChallenge(lessonId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const starterHtml = formData.get('starterHtml') as string || ''
  const starterCss = formData.get('starterCss') as string || ''
  const referenceCss = formData.get('referenceCss') as string || ''
  const maxScore = parseInt(formData.get('maxScore') as string || '100', 10)

  // Check if challenge already exists
  const { data: existing } = await supabase
    .from('css_challenges')
    .select('id')
    .eq('lesson_id', lessonId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('css_challenges')
      .update({
        title,
        description,
        starter_html: starterHtml,
        starter_css: starterCss,
        reference_css: referenceCss,
        max_score: maxScore
      })
      .eq('id', existing.id)
    if (error) throw new Error('Gagal memperbarui soal: ' + error.message)
  } else {
    const { error } = await supabase
      .from('css_challenges')
      .insert({
        lesson_id: lessonId,
        title,
        description,
        starter_html: starterHtml,
        starter_css: starterCss,
        reference_css: referenceCss,
        max_score: maxScore,
        created_by: user.id
      })
    if (error) throw new Error('Gagal membuat soal: ' + error.message)
  }

  revalidatePath(`/admin/css-challenges/${lessonId}`)
}
