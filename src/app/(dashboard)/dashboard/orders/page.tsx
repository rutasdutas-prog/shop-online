import { createClient } from '@/lib/supabase/server'
import { OrderPdfButton } from '@/components/orders/order-pdf-button'
import { OrderStatusSelect } from '@/components/orders/order-status-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import Link from 'next/link'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function OrdersPage(props: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient()
  const { store } = await requireStore()
  const searchParams = await props.searchParams
  const search = searchParams?.search || ''
  const lang = await getLanguage()
  const dict = dictionaries[lang]

  let query = supabase
    .from('orders')
    .select('*, customers(name, phone), order_items(id, quantity, unit_price, subtotal, product:products(name, images, sku))')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customers.name.ilike.%${search}%,customers.phone.ilike.%${search}%`)
  }

  const { data: orders } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{dict.orders.title}</h1>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Cari Order / Nama / HP..."
            className="px-4 py-2 border rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
          <button type="submit" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800">
            Cari
          </button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.orders.subtitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">{search ? 'Tidak ada pesanan yang sesuai pencarian.' : dict.orders.noOrders}</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="bg-zinc-50 border-b">
                  <tr>
                    <th className="px-4 py-3">{dict.orders.tableOrder}</th>
                    <th className="px-4 py-3">{dict.orders.tableCustomer}</th>
                    <th className="px-4 py-3">No. HP</th>
                    <th className="px-4 py-3">{dict.orders.tableTotal}</th>
                    <th className="px-4 py-3">{dict.orders.tableStatus}</th>
                    <th className="px-4 py-3">{dict.orders.tableDate}</th>
                    <th className="px-4 py-3">PDF</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    return (
                      <tr key={order.id} className="border-b hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{order.order_number}</td>
                        <td className="px-4 py-3">{(order.customers as any)?.name || 'Guest'}</td>
                        <td className="px-4 py-3 text-zinc-600">{(order.customers as any)?.phone || '-'}</td>
                        <td className="px-4 py-3 font-semibold">Rp {order.total_amount.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <OrderPdfButton order={order as any} storeName={store?.name || ''} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors w-fit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Detail
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
