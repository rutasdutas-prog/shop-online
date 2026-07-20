import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { OrderPdfButton } from '@/components/orders/order-pdf-button'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Menunggu',   color: 'bg-yellow-100 text-yellow-700' },
  PAID:       { label: 'Dibayar',    color: 'bg-green-100 text-green-700' },
  PROCESSING: { label: 'Diproses',   color: 'bg-blue-100 text-blue-700' },
  COMPLETED:  { label: 'Selesai',    color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:  { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
  REFUNDED:   { label: 'Refund',     color: 'bg-purple-100 text-purple-700' },
}

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { user, store } = await requireStore()

  
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(name, phone, email, address),
      order_items(id, quantity, unit_price, subtotal, product:products(id, name, images, sku))
    `)
    .eq('id', id)
    .eq('store_id', store.id)
    .single()

  if (!order) notFound()

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-zinc-100 text-zinc-700' }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors">
            ← Kembali
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">#{order.order_number}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
          <OrderPdfButton order={order as any} storeName={store.name} />
        </div>
      </div>

      {/* Customer Info */}
      {order.customer && (
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">Informasi Pembeli</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-400">Nama</p>
              <p className="font-medium text-zinc-800">{(order.customer as any).name}</p>
            </div>
            {(order.customer as any).phone && (
              <div>
                <p className="text-xs text-zinc-400">Telepon</p>
                <p className="font-medium text-zinc-800">{(order.customer as any).phone}</p>
              </div>
            )}
            {(order.customer as any).email && (
              <div>
                <p className="text-xs text-zinc-400">Email</p>
                <p className="font-medium text-zinc-800">{(order.customer as any).email}</p>
              </div>
            )}
            {(order.customer as any).address && (
              <div className="col-span-2">
                <p className="text-xs text-zinc-400">Alamat</p>
                <p className="font-medium text-zinc-800">{(order.customer as any).address}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <h2 className="text-sm font-semibold text-zinc-700 mb-4">Detail Produk</h2>
        <div className="space-y-3">
          {(order.order_items || []).map((item: any) => {
            const img = item.product?.images?.[0]
            return (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-zinc-50 last:border-0">
                {/* Product image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200">
                  {img ? (
                    <img src={img} alt={item.product?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">{item.product?.name || 'Produk dihapus'}</p>
                  {item.product?.sku && <p className="text-xs text-zinc-400 mt-0.5">SKU: {item.product.sku}</p>}
                  <p className="text-xs text-zinc-500 mt-0.5">Rp {item.unit_price.toLocaleString('id-ID')} × {item.quantity}</p>
                </div>

                {/* Subtotal */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-zinc-900">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-zinc-400">Qty: {item.quantity}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700">Total Pesanan</span>
          <span className="text-xl font-bold text-zinc-900">Rp {order.total_amount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Catatan Pesanan</p>
          <p className="text-sm text-amber-800">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
