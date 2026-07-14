import { createClient } from '@/lib/supabase/server'
import { OrderPdfButton } from '@/components/orders/order-pdf-button'

import { redirect } from 'next/navigation'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Menunggu',   color: 'bg-yellow-100 text-yellow-700' },
  PAID:       { label: 'Dibayar',    color: 'bg-green-100 text-green-700' },
  PROCESSING: { label: 'Diproses',   color: 'bg-blue-100 text-blue-700' },
  COMPLETED:  { label: 'Selesai',    color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:  { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
  REFUNDED:   { label: 'Refund',     color: 'bg-purple-100 text-purple-700' },
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

  const lang = await getLanguage()
  const dict = dictionaries[lang]

  const { data: orders } = await supabase
    .from('orders')
    .select('*, customers(name, phone)')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dict.orders.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{dict.orders.subtitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">{dict.orders.noOrders}</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="px-4 py-3">{dict.orders.tableOrder}</th>
                  <th className="px-4 py-3">{dict.orders.tableCustomer}</th>
                  <th className="px-4 py-3">{dict.orders.tableTotal}</th>
                  <th className="px-4 py-3">{dict.orders.tableStatus}</th>
                  <th className="px-4 py-3">{dict.orders.tableDate}</th>
                  <th className="px-4 py-3">PDF</th>
<th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-zinc-100 text-zinc-700' }
                  return (
                    <tr key={order.id} className="border-b hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{order.order_number}</td>
                      <td className="px-4 py-3">{(order.customers as any)?.name || 'Guest'}</td>
                      <td className="px-4 py-3 font-semibold">Rp {order.total_amount.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
