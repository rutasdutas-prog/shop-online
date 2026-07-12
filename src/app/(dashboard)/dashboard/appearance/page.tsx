import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateAppearance } from '@/actions/appearance.actions'
import ThemePickerClient from './theme-picker-client'

export const dynamic = 'force-dynamic'

export default async function AppearancePage(props: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, theme_settings, slug')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/dashboard/setup')

  const settings = store.theme_settings || {
    theme_name: 'custom',
    theme_color: '#000000',
    hero_title: 'Selamat Datang di Toko Kami',
    hero_subtitle: 'Temukan produk-produk terbaik dengan harga terjangkau.',
    corner_style: 'rounded-3xl',
    gradient_from: '#000000',
    gradient_to: '#333333'
  }

  return (
    <ThemePickerClient
      settings={settings}
      storeSlug={store.slug}
      updateAction={updateAppearance}
      successMsg={searchParams?.success}
      errorMsg={searchParams?.error}
    />
  )
}
