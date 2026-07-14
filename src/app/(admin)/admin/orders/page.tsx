import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrdersTable } from '@/components/admin/orders-table'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')

  // Fetch all orders with store info
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at, store_id, customer_id')
    .order('created_at', { ascending: false })

  // Fetch all stores
  const storeIds = [...new Set((orders || []).map(o => o.store_id))]
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, slug')
    .in('id', storeIds.length > 0 ? storeIds : [''])

  const storeMap = Object.fromEntries((stores || []).map(s => [s.id, s]))

  // Fetch order items
  const orderIds = (orders || []).map(o => o.id)
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, order_id, quantity, unit_price, subtotal, product_id')
    .in('order_id', orderIds.length > 0 ? orderIds : [''])

  // Fetch products for item names
  const productIds = [...new Set((orderItems || []).map(i => i.product_id).filter(Boolean))]
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds.length > 0 ? productIds : [''])

  const productMap = Object.fromEntries((products || []).map(p => [p.id, p]))

  // Fetch customers
  const customerIds = [...new Set((orders || []).map(o => o.customer_id).filter(Boolean))]
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .in('id', customerIds.length > 0 ? customerIds : [''])

  const customerMap = Object.fromEntries((customers || []).map(c => [c.id, c]))

  // Group items by order
  const itemsByOrder: Record<string, any[]> = {}
  ;(orderItems || []).forEach(item => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push({
      id: item.id,
      product_name: productMap[item.product_id]?.name || 'Produk Dihapus',
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })
  })

  const ordersData = (orders || []).map(o => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    total_amount: Number(o.total_amount),
    created_at: o.created_at,
    store_id: o.store_id,
    store_name: storeMap[o.store_id]?.name || 'Toko Tidak Dikenal',
    store_slug: storeMap[o.store_id]?.slug || '',
    customer_name: customerMap[o.customer_id]?.name || null,
    items: itemsByOrder[o.id] || [],
  }))

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Semua Orderan</h1>
        <p className="text-sm text-zinc-500 mt-1">Pantau transaksi dari seluruh toko di platform</p>
      </div>
      <OrdersTable orders={ordersData} />
    </div>
  )
}
