'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateAppearance(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id, slug').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

  const themeColor = formData.get('theme_color') as string
  const heroTitle = formData.get('hero_title') as string
  const heroSubtitle = formData.get('hero_subtitle') as string
  const cornerStyle = formData.get('corner_style') as string
  const gradientFrom = formData.get('gradient_from') as string
  const gradientTo = formData.get('gradient_to') as string
  
  const theme_settings = {
    theme_color: themeColor || '#000000',
    hero_title: heroTitle || 'Selamat Datang',
    hero_subtitle: heroSubtitle || 'Temukan produk terbaik kami',
    corner_style: cornerStyle || 'rounded-3xl',
    gradient_from: gradientFrom || '#000000',
    gradient_to: gradientTo || '#333333'
  }

  const { error } = await supabase
    .from('stores')
    .update({ theme_settings })
    .eq('id', store.id)

  if (error) {
    redirect(`/dashboard/appearance?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/appearance')
  revalidatePath(`/${store.slug}`)
  
  redirect('/dashboard/appearance?success=Tampilan berhasil diperbarui!')
}
