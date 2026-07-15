import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export const getDashboardData = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    return { user: null, store: null }
  }

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()
    
  return { user, store: store || null }
})

export const requireUser = async () => {
  const { user, store } = await getDashboardData()
  if (!user) redirect('/login')
  return { user, store }
}

export const requireStore = async () => {
  const { user, store } = await getDashboardData()
  if (!user) redirect('/login')
  if (!store) redirect('/dashboard/setup')
  return { user, store }
}
