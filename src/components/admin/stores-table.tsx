'use client'

import { useState, useTransition } from 'react'
import { toggleStoreStatus, deleteStore } from '@/actions/admin.actions'

interface Store {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
  logo_url: string | null
  owner: { full_name: string | null; email: string | null } | null
  productCount: number
  orderCount: number
}

interface ConfirmDialog {
  type: 'suspend' | 'activate' | 'delete'
  storeId: string
  storeName: string
  currentStatus: string
}

export function StoresTable({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()) ||
    (s.owner?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.owner?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = () => {
    if (!confirm) return
    startTransition(async () => {
      if (confirm.type === 'delete') {
        const fd = new FormData()
        fd.append('store_id', confirm.storeId)
        await deleteStore(fd)
      } else {
        const fd = new FormData()
        fd.append('store_id', confirm.storeId)
        fd.append('current_status', confirm.currentStatus)
        await toggleStoreStatus(fd)
      }
      setConfirm(null)
    })
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cari toko, slug, atau pemilik..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">✕</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Toko</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pemilik</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Produk</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tgl Daftar</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((store) => (
                <tr key={store.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-base font-bold text-zinc-300 overflow-hidden shrink-0">
                        {store.logo_url
                          ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                          : store.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{store.name}</div>
                        <a href={`/${store.slug}`} target="_blank" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">/{store.slug} ↗</a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-300">{store.owner?.full_name || '-'}</div>
                    <div className="text-xs text-zinc-600">{store.owner?.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-300 font-medium">{store.productCount}</span>
                    <span className="text-xs text-zinc-600 ml-1">produk</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-300 font-medium">{store.orderCount}</span>
                    <span className="text-xs text-zinc-600 ml-1">order</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
                      store.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${store.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {store.status === 'ACTIVE' ? 'Aktif' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-500">{new Date(store.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirm({
                          type: store.status === 'ACTIVE' ? 'suspend' : 'activate',
                          storeId: store.id,
                          storeName: store.name,
                          currentStatus: store.status,
                        })}
                        disabled={isPending}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                          store.status === 'ACTIVE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {store.status === 'ACTIVE' ? 'Suspend' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => setConfirm({ type: 'delete', storeId: store.id, storeName: store.name, currentStatus: store.status })}
                        disabled={isPending}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-zinc-600 text-sm">
                    {search ? `Tidak ada toko yang cocok dengan "${search}"` : 'Belum ada toko terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto ${
              confirm.type === 'delete' ? 'bg-red-500/15' : confirm.type === 'suspend' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
            }`}>
              {confirm.type === 'delete' ? '🗑️' : confirm.type === 'suspend' ? '⏸️' : '▶️'}
            </div>
            <h3 className="text-base font-bold text-white text-center mb-2">
              {confirm.type === 'delete' ? 'Hapus Toko?' : confirm.type === 'suspend' ? 'Suspend Toko?' : 'Aktifkan Toko?'}
            </h3>
            <p className="text-sm text-zinc-400 text-center mb-1">
              {confirm.type === 'delete'
                ? 'Tindakan ini akan menghapus toko secara permanen.'
                : confirm.type === 'suspend'
                ? 'Toko tidak akan bisa diakses oleh pembeli.'
                : 'Toko akan dapat diakses kembali oleh pembeli.'}
            </p>
            <p className="text-sm font-semibold text-white text-center mb-6">
              "{confirm.storeName}"
            </p>
            {confirm.type === 'delete' && (
              <p className="text-xs text-red-400 text-center mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                ⚠️ Semua produk toko ini akan ikut terhapus. Tidak bisa dibatalkan!
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 ${
                  confirm.type === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : confirm.type === 'suspend'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isPending ? '...' : confirm.type === 'delete' ? 'Ya, Hapus' : confirm.type === 'suspend' ? 'Ya, Suspend' : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
