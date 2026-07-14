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
  await supabase.from('stores').delete().eq('id', storeId)
  revalidatePath('/admin/stores')
  revalidatePath('/admin')
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
