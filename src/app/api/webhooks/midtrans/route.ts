import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    // Verifikasi Signature Key Midtrans (Penting untuk Security!)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body

    const hash = crypto.createHash('sha512')
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    const calculatedSignature = hash.digest('hex')

    if (calculatedSignature !== signature_key) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 })
    }

    // Tentukan status internal berdasarkan transaction_status Midtrans
    let paymentStatus = 'PENDING'
    let orderStatus = 'PENDING'

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'PAID'
      orderStatus = 'PAID'
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      paymentStatus = 'EXPIRED'
      orderStatus = 'CANCELLED'
    }

    // Update tabel payments
    await supabase
      .from('payments')
      .update({ status: paymentStatus, transaction_id: body.transaction_id })
      .eq('order_id', order_id)

    // Update tabel orders
    await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('id', order_id)

    // Jika PAID, kurangi stok (Inventory)
    if (orderStatus === 'PAID') {
      // Logic untuk mengurangi stok (Sprint 7)
    }

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
