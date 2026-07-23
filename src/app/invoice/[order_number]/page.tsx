import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Menunggu',   color: 'bg-yellow-100 text-yellow-700' },
  PAID:       { label: 'Dibayar',    color: 'bg-green-100 text-green-700' },
  PROCESSING: { label: 'Diproses',   color: 'bg-blue-100 text-blue-700' },
  COMPLETED:  { label: 'Selesai',    color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:  { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
  REFUNDED:   { label: 'Refund',     color: 'bg-purple-100 text-purple-700' },
}

export default async function InvoicePage(props: { params: Promise<{ order_number: string }> }) {
  const { order_number } = await props.params
  const adminDb = getAdminClient()

  const { data: order, error } = await adminDb
    .from('orders')
    .select(`
      *,
      store:stores(name, logo_url),
      customer:customers(name, phone, email, address),
      order_items(id, quantity, unit_price, subtotal, product:products(id, name, images, sku))
    `)
    .eq('order_number', order_number)
    .single()

  if (error) {
    console.error('Invoice fetch error:', error)
  }

  if (!order) {
    // Return the actual error message to the page for debugging
    if (error) {
       return <div className="p-8 text-red-500">Error fetching order: {error.message}</div>
    }
    notFound()
  }

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-zinc-100 text-zinc-700' }
  const store = order.store as any

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{store?.name || 'Toko'}</h1>
            <p className="text-sm text-zinc-500 mt-1">INVOICE / BUKTI PESANAN</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <Link href={`/api/invoice/${order.order_number}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded">
              Download PDF
            </Link>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex flex-col sm:flex-row justify-between mb-8 pb-6 border-b border-zinc-100 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 mb-1">Diterbitkan Kepada</h2>
              <p className="font-bold text-zinc-800 text-lg">{(order.customer as any)?.name || 'Pelanggan'}</p>
              <p className="text-sm text-zinc-600 mt-1">{(order.customer as any)?.phone}</p>
              {/* @ts-ignore */}
              {order.customer?.address && <p className="text-sm text-zinc-600 mt-1">{(order.customer as any).address}</p>}
            </div>
            <div className="sm:text-right">
              <h2 className="text-sm font-semibold text-zinc-400 mb-1">Nomor Pesanan</h2>
              <p className="font-bold text-zinc-800">#{order.order_number}</p>
              <p className="text-sm text-zinc-600 mt-1">Tanggal: {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th className="pb-3 font-semibold">Produk</th>
                  <th className="pb-3 font-semibold text-right">Harga</th>
                  <th className="pb-3 font-semibold text-center">Qty</th>
                  <th className="pb-3 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {(order.order_items || []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-100 border border-zinc-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 text-[10px]">No Img</div>
                        )}
                        <div>
                          <p className="font-semibold text-zinc-800">{item.product?.name || 'Produk'}</p>
                          {item.product?.sku && <p className="text-xs text-zinc-500">SKU: {item.product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right text-zinc-600">Rp {item.unit_price.toLocaleString('id-ID')}</td>
                    <td className="py-4 text-center font-medium text-zinc-700">{item.quantity}</td>
                    <td className="py-4 text-right font-bold text-zinc-900">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-col items-end gap-2">
            <div className="flex items-center justify-between w-full sm:w-64">
              <span className="text-zinc-500 font-medium">Total</span>
              <span className="text-xl font-bold text-zinc-900">Rp {order.total_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Catatan</p>
            <p className="text-sm text-amber-800">{order.notes}</p>
          </div>
        )}

        <div className="text-center pt-8 text-sm text-zinc-400">
          <p>Terima kasih telah berbelanja di <span className="font-semibold text-zinc-600">{store?.name}</span>!</p>
        </div>
      </div>
    </div>
  )
}
