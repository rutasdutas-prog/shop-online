'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')
  return supabase
}

export async function toggleStoreStatus(formData: FormData) {
  const supabase = await assertSuperAdmin()
  const storeId = formData.get('store_id') as string
  const currentStatus = formData.get('current_status') as string
  const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  await supabase.from('stores').update({ status: newStatus }).eq('id', storeId)
  revalidatePath('/admin/stores')
  revalidatePath('/admin')
}

export async function deleteStore(formData: FormData) {
  const supabase = await assertSuperAdmin()
  const storeId = formData.get('store_id') as string

  try {
    // 1. Delete cart items via carts
    const { data: carts } = await supabase.from('carts').select('id').eq('store_id', storeId)
    if (carts && carts.length > 0) {
      const cartIds = carts.map(c => c.id)
      await supabase.from('cart_items').delete().in('cart_id', cartIds)
    }
    await supabase.from('carts').delete().eq('store_id', storeId)

    // 2. Delete orders and order items
    const { data: orders } = await supabase.from('orders').select('id').eq('store_id', storeId)
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      await supabase.from('order_items').delete().in('order_id', orderIds)
    }
    await supabase.from('orders').delete().eq('store_id', storeId)

    // 3. Delete vouchers
    await supabase.from('vouchers').delete().eq('store_id', storeId)

    // 4. Delete knowledge base
    await supabase.from('knowledge_base').delete().eq('store_id', storeId)

    // 5. Delete products, inventory, and inventory_histories
    await supabase.from('inventory_histories').delete().eq('store_id', storeId)
    
    const { data: products } = await supabase.from('products').select('id').eq('store_id', storeId)
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id)
      await supabase.from('inventory').delete().in('product_id', productIds)
    }
    await supabase.from('products').delete().eq('store_id', storeId)

    // 6. Delete categories
    await supabase.from('categories').delete().eq('store_id', storeId)

    // 7. Finally delete the store itself (slug freed for reuse)
    const { error } = await supabase.from('stores').delete().eq('id', storeId)
    
    if (error) {
      console.error("Delete store error:", error)
      throw error
    }

    revalidatePath('/', 'layout') // clear all caches including the static store paths
  } catch (err: any) {
    console.error("Failed to delete store fully:", err)
    // we can throw or just ignore, but better to log it at least.
  }
}

export async function suspendUser(formData: FormData) {
  const supabase = await assertSuperAdmin()
  const userId = formData.get('user_id') as string
  // Suspend = set role to SUSPENDED (or we block by suspending their store)
  await supabase.from('users').update({ role: 'SUSPENDED' }).eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
}

export async function restoreUser(formData: FormData) {
  const supabase = await assertSuperAdmin()
  const userId = formData.get('user_id') as string
  const prevRole = formData.get('prev_role') as string || 'OWNER'
  await supabase.from('users').update({ role: prevRole }).eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
}

export async function deleteUser(formData: FormData) {
  const supabase = await assertSuperAdmin()
  const userId = formData.get('user_id') as string
  // Delete user's stores first (cascades), then user row
  await supabase.from('stores').delete().eq('owner_id', userId)
  await supabase.from('users').delete().eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
}
