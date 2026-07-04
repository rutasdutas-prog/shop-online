'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function processCheckout(storeId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const notes = formData.get('notes') as string

  // 1. Upsert Customer
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .upsert({ store_id: storeId, name, phone, email, address }, { onConflict: 'store_id, phone' })
    .select()
    .single()

  if (custError || !customer) {
    throw new Error('Gagal memproses data pelanggan')
  }

  // 2. Create Order
  const orderNumber = `ORD-${Date.now()}`
  const totalAmount = 150000 // Placeholder: Hitung dari cart
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      customer_id: customer.id,
      order_number: orderNumber,
      total_amount: totalAmount,
      notes,
      status: 'PENDING'
    })
    .select()
    .single()

  if (orderError || !order) {
    throw new Error('Gagal membuat pesanan')
  }

  // 3. (Opsional) Create Payment record pending
  await supabase.from('payments').insert({
    order_id: order.id,
    amount: totalAmount,
    status: 'PENDING'
  })

  // Di aplikasi nyata, kita akan memanggil API Midtrans Snap di sini untuk mendapatkan URL pembayaran
  redirect(`/checkout/success?order_id=${order.id}`)
}
