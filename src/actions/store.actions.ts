'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

async function uploadFile(supabase: any, file: File, storeId: string, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Format file tidak didukung: ${file.type}. Gunakan JPG, PNG, atau MP4.`)
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Ukuran file terlalu besar. Maksimal ${MAX_SIZE_MB}MB.`)
  }

  const ext = file.name.split('.').pop()
  const fileName = `${storeId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('products') // reuse the products bucket for store assets
    .upload(fileName, bytes, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload gagal: ${error.message}`)

  const { data } = supabase.storage.from('products').getPublicUrl(fileName)
  return data.publicUrl
}

export async function updateStore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, slug')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/dashboard/setup')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const whatsappRaw = formData.get('whatsapp') as string
  const whatsapp = whatsappRaw ? whatsappRaw.replace(/\D/g, '') : ''
  const instagram = formData.get('instagram') as string
  const address = formData.get('address') as string

  let logo_url = formData.get('existing_logo') as string
  const logoFile = formData.get('logo') as File
  if (logoFile && logoFile.size > 0) {
    try {
      logo_url = await uploadFile(supabase, logoFile, store.id, 'logo')
    } catch (err: any) {
      redirect(`/dashboard/settings?error=${encodeURIComponent(err.message)}`)
    }
  }

  let banner_url = formData.get('existing_banner') as string
  const bannerFile = formData.get('banner') as File
  if (bannerFile && bannerFile.size > 0) {
    try {
      banner_url = await uploadFile(supabase, bannerFile, store.id, 'banner')
    } catch (err: any) {
      redirect(`/dashboard/settings?error=${encodeURIComponent(err.message)}`)
    }
  }

  const facebook = formData.get('facebook') as string
  const tiktok = formData.get('tiktok') as string

  const { data: currentStore } = await supabase.from('stores').select('theme_settings').eq('id', store.id).single()
  const theme_settings = {
    ...(currentStore?.theme_settings || {}),
    facebook,
    tiktok
  }

  const { error } = await supabase
    .from('stores')
    .update({ name, description, whatsapp, instagram, address, logo_url, banner_url, theme_settings })
    .eq('id', store.id)

  if (error) {
    redirect(`/dashboard/settings?error=Gagal menyimpan: ${error.message}`)
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  revalidatePath(`/${store.slug}`, 'layout')

  redirect('/dashboard/settings?success=Pengaturan toko berhasil disimpan!')
}

export async function createStore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string

  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    redirect('/dashboard/setup?error=Slug hanya boleh berisi huruf kecil, angka, dan strip (-)')
  }

  const { data: existingStore } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingStore) {
    redirect('/dashboard/setup?error=Slug sudah digunakan, silakan pilih yang lain')
  }

  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
      role: 'OWNER',
    }, { onConflict: 'id' })

  if (userError) {
    redirect(`/dashboard/setup?error=Gagal sinkronisasi user: ${userError.message}`)
  }

  const { error } = await supabase
    .from('stores')
    .insert({ owner_id: user.id, name, slug, description, status: 'ACTIVE' })

  if (error) {
    redirect(`/dashboard/setup?error=Gagal membuat toko: ${error.message}`)
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}
