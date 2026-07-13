'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateStock(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

  const productId = formData.get('product_id') as string
  const stockLevel = parseInt(formData.get('stock_level') as string, 10)

  // Update stock di tabel products
  const { error } = await supabase
    .from('products')
    .update({ stock: stockLevel })
    .eq('id', productId)
    .eq('store_id', store.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}
