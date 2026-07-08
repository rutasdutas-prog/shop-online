import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toggleStoreStatus } from '@/actions/admin.actions'

export const dynamic = 'force-dynamic'

export default async function AdminStoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, slug, status, created_at, logo_url, owner_id')
    .order('created_at', { ascending: false })

  // Get product counts per store and owner emails
  const ownerIds = (stores || []).map(s => s.owner_id).filter(Boolean)

  const { data: owners } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', ownerIds.length > 0 ? ownerIds : [''])

  const ownerMap = Object.fromEntries((owners || []).map(o => [o.id, o]))

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Toko</h1>
        <p className="text-sm text-zinc-500 mt-1">{(stores || []).length} toko terdaftar di platform</p>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Toko</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pemilik</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tgl Daftar</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(stores || []).map((store) => {
                const owner = ownerMap[store.owner_id]
                return (
                  <tr key={store.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-base font-bold text-zinc-300 overflow-hidden shrink-0">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                          ) : (
                            store.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{store.name}</div>
                          <a href={`/${store.slug}`} target="_blank" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">/{store.slug} ↗</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-300">{owner?.full_name || '-'}</div>
                      <div className="text-xs text-zinc-600">{owner?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
                        store.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          store.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}></span>
                        {store.status === 'ACTIVE' ? 'Aktif' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-500">{new Date(store.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={toggleStoreStatus}>
                        <input type="hidden" name="store_id" value={store.id} />
                        <input type="hidden" name="current_status" value={store.status} />
                        <button
                          type="submit"
                          className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                            store.status === 'ACTIVE'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {store.status === 'ACTIVE' ? 'Suspend' : 'Aktifkan'}
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {(!stores || stores.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-600 text-sm">Belum ada toko terdaftar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
