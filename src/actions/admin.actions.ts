'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function toggleStoreStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const storeId = formData.get('store_id') as string
  const currentStatus = formData.get('current_status') as string
  const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'

  await supabase
    .from('stores')
    .update({ status: newStatus })
    .eq('id', storeId)

  revalidatePath('/admin/stores')
  revalidatePath('/admin')
}
