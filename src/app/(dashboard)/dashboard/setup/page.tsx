import { createStore } from '@/actions/store.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function SetupStorePage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { user, store } = await requireUser()

  
  if (store) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">TK</span>
          </div>
          <span className="font-semibold text-zinc-900">TokoKita</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Setup Toko Anda</h1>
          <p className="text-sm text-zinc-400 mb-6">Lengkapi informasi toko untuk mulai berjualan.</p>

          <form action={createStore} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-zinc-700">Nama Toko</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Toko Maju Jaya"
                required
                className="h-9 text-sm border-zinc-200 focus:border-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-medium text-zinc-700">URL Toko</Label>
              <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden focus-within:border-zinc-400 transition-colors">
                <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2 text-xs text-zinc-400 shrink-0">
                  tokokita.com/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="tokomaju"
                  required
                  pattern="[a-z0-9-]+"
                  title="Hanya huruf kecil, angka, dan strip"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
              </div>
              <p className="text-xs text-zinc-400">Hanya huruf kecil, angka, dan tanda strip (-)</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium text-zinc-700">Deskripsi <span className="text-zinc-400 font-normal">(Opsional)</span></Label>
              <Input
                id="description"
                name="description"
                type="text"
                placeholder="Toko elektronik terlengkap..."
                className="h-9 text-sm border-zinc-200 focus:border-zinc-400"
              />
            </div>

            {searchParams?.error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-4 py-3">
                {searchParams.error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-zinc-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-zinc-700 transition-colors mt-2"
            >
              Buat Toko →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
