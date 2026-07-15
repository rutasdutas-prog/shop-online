import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateAppearance } from '@/actions/appearance.actions'
import ThemePickerClient from './theme-picker-client'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function AppearancePage(props: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { user, store } = await requireStore()

  
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
