import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateAppearance } from '@/actions/appearance.actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export default async function AppearancePage(props: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store, error } = await supabase
    .from('stores')
    .select('id, theme_settings, slug')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/dashboard/setup')

  const settings = store.theme_settings || {
    theme_color: '#000000',
    hero_title: 'Selamat Datang di Toko Kami',
    hero_subtitle: 'Temukan produk-produk terbaik dengan harga terjangkau.',
    corner_style: 'rounded-3xl',
    gradient_from: '#000000',
    gradient_to: '#333333'
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Tampilan Toko (CMS)</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Ubah desain dan teks pada halaman publik toko Anda secara mendetail.</p>
      </div>

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

      <form action={updateAppearance} className="space-y-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-5">
          <div>
            <h2 className="text-sm font-medium text-zinc-700 mb-4">Warna Utama & Aksen</h2>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                name="theme_color"
                defaultValue={settings.theme_color}
                className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
              />
              <div className="text-xs text-zinc-500">
                Warna solid ini akan digunakan untuk tombol, ikon, dan aksen pada halaman toko.
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-zinc-100">
            <h2 className="text-sm font-medium text-zinc-700 mb-4">Warna Gradient (Background Banner)</h2>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Mulai Dari (From)</span>
                <input 
                  type="color" 
                  name="gradient_from"
                  defaultValue={settings.gradient_from}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Sampai Ke (To)</span>
                <input 
                  type="color" 
                  name="gradient_to"
                  defaultValue={settings.gradient_to}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
              <div className="text-xs text-zinc-500 ml-4 max-w-xs">
                Kombinasi warna gradient ini akan dipakai sebagai latar belakang halaman utama (Banner) toko Anda untuk kesan yang elegan.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <h2 className="text-sm font-medium text-zinc-700 mb-2">Gaya Sudut (Corner Style)</h2>
            <p className="text-xs text-zinc-500 mb-4">Tentukan kelengkungan sudut untuk produk dan kotak elemen.</p>
            <div className="flex items-center gap-3">
              {[
                { label: 'Tajam', value: 'rounded-none', roundedClass: 'rounded-none' },
                { label: 'Sedang', value: 'rounded-xl', roundedClass: 'rounded-xl' },
                { label: 'Sangat Melengkung', value: 'rounded-3xl', roundedClass: 'rounded-3xl' },
              ].map(opt => (
                <label key={opt.value} className="relative cursor-pointer">
                  <input type="radio" name="corner_style" value={opt.value} defaultChecked={settings.corner_style === opt.value} className="peer sr-only" />
                  <div className="flex items-center justify-center w-28 h-12 bg-white border border-zinc-200 peer-checked:border-zinc-900 peer-checked:ring-1 peer-checked:ring-zinc-900 transition-all text-xs font-medium text-zinc-600 peer-checked:text-zinc-900 rounded-lg">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-700 mb-2">Teks Banner (Hero)</h2>
          
          <div className="space-y-1.5">
            <Label htmlFor="hero_title" className="text-xs font-medium text-zinc-600">Judul Utama</Label>
            <Input
              id="hero_title"
              name="hero_title"
              defaultValue={settings.hero_title}
              required
              className="h-9 text-sm border-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hero_subtitle" className="text-xs font-medium text-zinc-600">Sub-judul / Deskripsi Pendek</Label>
            <textarea
              id="hero_subtitle"
              name="hero_subtitle"
              defaultValue={settings.hero_subtitle}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <a
            href={`/${store.slug}`}
            target="_blank"
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            ↗ Preview toko publik
          </a>
          <button
            type="submit"
            className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}
