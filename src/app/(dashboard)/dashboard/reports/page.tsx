import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExportButtons } from '@/components/export-buttons'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { user, store } = await requireStore()

  
  // Ambil data order untuk laporan
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const allOrders = orders || []
  const paidOrders = allOrders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)

  // Order bulan ini
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const ordersThisMonth = allOrders.filter(o => o.created_at >= startOfMonth)
  const revenueThisMonth = ordersThisMonth
    .filter(o => o.status === 'PAID' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Laporan</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Ringkasan performa toko Anda</p>
        </div>
        <ExportButtons
          filename="Laporan_Order_TokoKita"
          data={allOrders.map(o => ({
            Order: o.order_number,
            Status: o.status,
            Total: o.total_amount,
            Tanggal: new Date(o.created_at).toLocaleDateString('id-ID')
          }))}
          columns={[
            { header: 'No Order', dataKey: 'Order' },
            { header: 'Status', dataKey: 'Status' },
            { header: 'Total', dataKey: 'Total' },
            { header: 'Tanggal', dataKey: 'Tanggal' }
          ]}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="text-xs text-zinc-400 mb-2">Total Pendapatan</div>
          <div className="text-lg font-semibold text-zinc-900">Rp {totalRevenue.toLocaleString('id-ID')}</div>
          <div className="text-xs text-zinc-400 mt-1">Semua waktu</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="text-xs text-zinc-400 mb-2">Bulan Ini</div>
          <div className="text-lg font-semibold text-zinc-900">Rp {revenueThisMonth.toLocaleString('id-ID')}</div>
          <div className="text-xs text-zinc-400 mt-1">{ordersThisMonth.length} order</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="text-xs text-zinc-400 mb-2">Total Produk</div>
          <div className="text-lg font-semibold text-zinc-900">{productCount ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="text-xs text-zinc-400 mb-2">Total Pelanggan</div>
          <div className="text-lg font-semibold text-zinc-900">{customerCount ?? 0}</div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-700 mb-4">Ringkasan Order</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map(status => {
            const count = allOrders.filter(o => o.status === status).length
            const colors: Record<string, string> = {
              PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
              PAID: 'bg-green-50 text-green-700 border-green-100',
              PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
              COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              CANCELLED: 'bg-zinc-50 text-zinc-500 border-zinc-100',
              REFUNDED: 'bg-red-50 text-red-600 border-red-100',
            }
            return (
              <div key={status} className={`rounded-xl border p-3 text-center ${colors[status]}`}>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs mt-0.5 capitalize">{status.toLowerCase()}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700">Order Terbaru</h2>
          <a href="/dashboard/orders" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">Lihat semua →</a>
        </div>
        {allOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-zinc-500">Belum ada data order</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500">Order</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500">Total</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-zinc-500">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.slice(0, 10).map(order => (
                <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-zinc-800">{order.order_number}</td>
                  <td className="px-5 py-2.5 text-zinc-700">Rp {Number(order.total_amount).toLocaleString('id-ID')}</td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                      ${order.status === 'PAID' ? 'bg-green-50 text-green-700' :
                        order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                        order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-zinc-50 text-zinc-500'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right text-zinc-400 text-xs">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
