import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/checkout/draft — Buat draft order dari cart
export async function POST(request: Request) {
  try {
    const { store_id, session_id, customer_name, customer_phone, customer_address, notes, items: frontendItems } = await request.json()
    const supabase = await createClient()

    // Ambil cart
    const { data: cart } = await supabase
      .from('carts')
      .select('id, voucher_code')
      .eq('store_id', store_id)
      .eq('session_id', session_id)
      .single()

    if (!cart) {
      return NextResponse.json({ error: 'Cart kosong atau tidak ditemukan.' }, { status: 404 })
    }

    // Gunakan item dari frontend jika ada (karena state lokal mungkin beda dengan DB)
    if (frontendItems && Array.isArray(frontendItems)) {
      // Sync DB cart_items
      await supabase.from('cart_items').delete().eq('cart_id', cart.id)
      if (frontendItems.length > 0) {
        await supabase.from('cart_items').insert(
          frontendItems.map(item => ({
            cart_id: cart.id,
            product_id: item.id.replace(item.variant || '', ''), // ID produk asli
            quantity: item.quantity,
            unit_price: item.price
          }))
        )
      }
    }

    // Ambil items dari DB (sekarang sudah tersinkronisasi)
    const { data: items } = await supabase
      .from('cart_items')
      .select('quantity, unit_price, product_id, products(name, sku)')
      .eq('cart_id', cart.id)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart masih kosong.' }, { status: 400 })
    }

    // Validasi stok
    for (const item of items) {
      const { data: inv } = await supabase
        .from('inventory')
        .select('stock_level')
        .eq('product_id', item.product_id)
        .single()

      if (inv && inv.stock_level < item.quantity) {
        const prod = item.products as any
        return NextResponse.json({
          error: `Stok ${prod?.name || item.product_id} tidak mencukupi. Tersisa ${inv.stock_level} unit.`
        }, { status: 400 })
      }
    }

    // Hitung total
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    let discount = 0
    let voucherData = null

    if (cart.voucher_code) {
      const { data: v } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', store_id)
        .eq('code', cart.voucher_code)
        .single()

      if (v) {
        voucherData = v
        if (v.type === 'PERCENT') {
          discount = subtotal * (v.value / 100)
          if (v.max_discount && discount > v.max_discount) discount = v.max_discount
        } else {
          discount = v.value
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discount)

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Buat atau cari customer jika ada data
    let customerId = null
    if (customer_name && (customer_phone || customer_address)) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', store_id)
        .eq('phone', customer_phone || '')
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else if (customer_name) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({ store_id, name: customer_name, phone: customer_phone, address: customer_address })
          .select('id')
          .single()
        customerId = newCustomer?.id
      }
    }

    // Buat Draft Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id,
        customer_id: customerId,
        order_number: orderNumber,
        status: 'PENDING',
        total_amount: totalAmount,
        notes: notes || `Draft order via AI Chatbot${customer_name ? ` - ${customer_name}` : ''}`
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Gagal membuat order: ' + orderError?.message }, { status: 500 })
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity
    }))
    await supabase.from('order_items').insert(orderItems)

    // Update used_count voucher jika dipakai
    if (voucherData) {
      await supabase
        .from('vouchers')
        .update({ used_count: (voucherData.used_count || 0) + 1 })
        .eq('id', voucherData.id)
    }

    // Buat ringkasan untuk AI / WhatsApp
    const itemSummary = items.map(i => {
      const prod = i.products as any
      return `  - ${prod?.name || 'Produk'} x${i.quantity} = Rp ${(i.unit_price * i.quantity).toLocaleString('id-ID')}`
    }).join('\n')

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const invoiceUrl = `${protocol}://${host}/invoice/${order.order_number}`
    const pdfUrl = `${protocol}://${host}/api/invoice/${order.order_number}`

    const summary = `Halo, saya ingin melakukan pemesanan:

🔖 *No. Order:* ${order.order_number}
${customer_name ? `👤 *Nama:* ${customer_name}\n` : ''}${customer_phone ? `📱 *HP:* ${customer_phone}\n` : ''}
*Detail Pesanan:*
${itemSummary}

💰 Subtotal: Rp ${subtotal.toLocaleString('id-ID')}${discount > 0 ? `\n🎁 Diskon (${cart.voucher_code}): -Rp ${discount.toLocaleString('id-ID')}` : ''}
*Total Pembayaran: Rp ${totalAmount.toLocaleString('id-ID')}*

📄 *Lihat Invoice Online:*
${invoiceUrl}

📥 *Download PDF Invoice:*
${pdfUrl}

Mohon informasi untuk proses pembayaran selanjutnya. Terima kasih!`

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      total_amount: totalAmount,
      summary
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
