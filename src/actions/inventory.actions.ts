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

  // Upsert inventory
  const { error } = await supabase
    .from('inventory')
    .upsert({
      store_id: store.id,
      product_id: productId,
      stock_level: stockLevel,
      low_stock_threshold: 5 // Default
    }, { onConflict: 'product_id' })

  if (error) {
    return { error: error.message }
  }

  // Record history
  await supabase.from('inventory_histories').insert({
    store_id: store.id,
    inventory_id: (await supabase.from('inventory').select('id').eq('product_id', productId).single()).data?.id,
    type: 'ADJUSTMENT',
    quantity: stockLevel,
    notes: 'Update manual dari dashboard',
    created_by: user.id
  })

  revalidatePath('/dashboard/inventory')
  return { success: true }
}
