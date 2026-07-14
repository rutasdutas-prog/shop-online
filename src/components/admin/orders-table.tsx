'use client'

import { useState } from 'react'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  store_id: string
  store_name: string
  store_slug: string
  customer_name: string | null
  items: OrderItem[]
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PAID: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  REFUNDED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Lunas',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Direfund',
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = orders.filter(o =>
    o.store_name.toLowerCase().includes(search.toLowerCase()) ||
    o.store_slug.toLowerCase().includes(search.toLowerCase()) ||
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()))
  )

  const totalRevenue = filtered.reduce((s, o) => s + (o.status !== 'CANCELLED' && o.status !== 'REFUNDED' ? o.total_amount : 0), 0)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Orderan</div>
          <div className="text-2xl font-bold text-white">{filtered.length}</div>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Pendapatan</div>
          <div className="text-2xl font-bold text-emerald-400">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Order Selesai</div>
          <div className="text-2xl font-bold text-blue-400">
            {filtered.filter(o => o.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cari toko, order, produk, atau pelanggan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">✕</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Toko</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item Terjual</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tanggal</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((order) => (
                <>
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-violet-300">#{order.order_number}</div>
                      {order.customer_name && (
                        <div className="text-xs text-zinc-500 mt-0.5">{order.customer_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-white">{order.store_name}</div>
                      <a href={`/${order.store_slug}`} target="_blank" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">/{order.store_slug} ↗</a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {order.items.slice(0, 2).map(item => (
                          <div key={item.id} className="text-xs text-zinc-400">
                            {item.product_name} <span className="text-zinc-600">×{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-zinc-600">+{order.items.length - 2} item lainnya</div>
                        )}
                        {order.items.length === 0 && (
                          <div className="text-xs text-zinc-700 italic">Tidak ada item</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-white">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[order.status] || statusColors.PENDING}`}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="text-xs text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {expandedId === order.id ? 'Tutup' : 'Lihat'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`${order.id}-expand`}>
                      <td colSpan={7} className="px-6 pb-4">
                        <div className="bg-zinc-800/60 border border-white/5 rounded-xl p-4">
                          <div className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Detail Item</div>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="text-white font-medium">{item.product_name}</span>
                                  <span className="text-zinc-500 ml-2">× {item.quantity}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-zinc-400 text-xs">@Rp {item.unit_price.toLocaleString('id-ID')}</div>
                                  <div className="text-white font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                            <span className="text-xs text-zinc-500">Total</span>
                            <span className="text-white font-bold">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-zinc-600 text-sm">
                    {search ? `Tidak ada order yang cocok dengan "${search}"` : 'Belum ada orderan di platform.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
