import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StoresTable } from '@/components/admin/stores-table'

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
    .neq('status', 'SUSPENDED')
    .order('created_at', { ascending: false })

  const ownerIds = (stores || []).map(s => s.owner_id).filter(Boolean)
  const { data: owners } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', ownerIds.length > 0 ? ownerIds : [''])

  const ownerMap = Object.fromEntries((owners || []).map(o => [o.id, o]))

  // Product & order counts per store
  const storeIds = (stores || []).map(s => s.id)
  const { data: productCounts } = await supabase
    .from('products')
    .select('store_id')
    .in('store_id', storeIds.length > 0 ? storeIds : [''])

  const { data: orderCounts } = await supabase
    .from('orders')
    .select('store_id')
    .in('store_id', storeIds.length > 0 ? storeIds : [''])

  const productCountMap: Record<string, number> = {}
  const orderCountMap: Record<string, number> = {}
  ;(productCounts || []).forEach(p => { productCountMap[p.store_id] = (productCountMap[p.store_id] || 0) + 1 })
  ;(orderCounts || []).forEach(o => { orderCountMap[o.store_id] = (orderCountMap[o.store_id] || 0) + 1 })

  const storesData = (stores || []).map(s => ({
    ...s,
    owner: ownerMap[s.owner_id] || null,
    productCount: productCountMap[s.id] || 0,
    orderCount: orderCountMap[s.id] || 0,
  }))

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Toko</h1>
        <p className="text-sm text-zinc-500 mt-1">{(stores || []).length} toko terdaftar di platform</p>
      </div>
      <StoresTable stores={storesData} />
    </div>
  )
}
