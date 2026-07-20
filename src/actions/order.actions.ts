'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    
    if (error) throw error
    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
