import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateStore } from '@/actions/store.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { LogoUpload } from '@/components/settings/logo-upload'
import { BannerUpload } from '@/components/settings/banner-upload'
import { WhatsAppInput } from '@/components/settings/whatsapp-input'

export const dynamic = 'force-dynamic'

export default async function SettingsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/dashboard/setup')

  const lang = await getLanguage()
  const dict = dictionaries[lang]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{dict.settings.title}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{dict.settings.subtitle}</p>
      </div>

      {/* Notifikasi */}
      {searchParams?.success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">
          ✓ {searchParams.success}
        </div>
      )}
      {searchParams?.error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {searchParams.error}
        </div>
      )}

      <form action={updateStore} className="space-y-4">
        {/* Info Dasar */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-700 mb-4">{dict.settings.basicInfo}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 mb-1.5 block">{dict.settings.storeLogo}</Label>
                <LogoUpload currentLogo={store.logo_url} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 mb-1.5 block">{dict.settings.storeBanner}</Label>
                <BannerUpload currentBanner={store.banner_url} />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="name" className="text-xs font-medium text-zinc-600">{dict.settings.storeName}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={store.name}
                required
                className="h-9 text-sm border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-600">{dict.settings.storeUrl}</Label>
              <div className="flex items-center h-9 rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-sm text-zinc-400">
                tokokita.com/<span className="text-zinc-600 font-medium">{store.slug}</span>
              </div>
              <p className="text-xs text-zinc-400">{dict.settings.storeUrlDesc}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium text-zinc-600">{dict.settings.storeDescription}</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={store.description || ''}
                rows={3}
                placeholder={dict.settings.storeDescriptionPlaceholder}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium text-zinc-600">{dict.settings.address}</Label>
              <Input
                id="address"
                name="address"
                defaultValue={store.address || ''}
                placeholder="Jl. Contoh No. 1, Jakarta"
                className="h-9 text-sm border-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Kontak & Sosial Media */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-700 mb-4">{dict.settings.contactSocial}</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="text-xs font-medium text-zinc-600">{dict.settings.whatsapp}</Label>
              <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden focus-within:border-zinc-400 transition-colors">
                <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2 text-xs text-zinc-400 shrink-0">+62</span>
                <WhatsAppInput defaultValue={store.whatsapp || ''} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instagram" className="text-xs font-medium text-zinc-600">{dict.settings.instagram}</Label>
              <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden focus-within:border-zinc-400 transition-colors">
                <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2 text-xs text-zinc-400 shrink-0">@</span>
                <input
                  id="instagram"
                  name="instagram"
                  type="text"
                  defaultValue={store.instagram || ''}
                  placeholder="namatoko"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facebook" className="text-xs font-medium text-zinc-600">Facebook URL</Label>
              <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden focus-within:border-zinc-400 transition-colors">
                <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2 text-xs text-zinc-400 shrink-0">URL</span>
                <input
                  id="facebook"
                  name="facebook"
                  type="text"
                  defaultValue={store.theme_settings?.facebook || ''}
                  placeholder="https://facebook.com/namatoko"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tiktok" className="text-xs font-medium text-zinc-600">TikTok URL</Label>
              <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden focus-within:border-zinc-400 transition-colors">
                <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2 text-xs text-zinc-400 shrink-0">URL</span>
                <input
                  id="tiktok"
                  name="tiktok"
                  type="text"
                  defaultValue={store.theme_settings?.tiktok || ''}
                  placeholder="https://tiktok.com/@namatoko"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <a
            href={`/${store.slug}`}
            target="_blank"
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            {dict.settings.previewStore}
          </a>
          <button
            type="submit"
            className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            {dict.common.saveChanges}
          </button>
        </div>
      </form>
    </div>
  )
}
