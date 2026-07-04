import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/cart?store_id=xxx&session_id=xxx — Ambil isi cart
// POST /api/cart — Buat atau reset cart

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const store_id = searchParams.get('store_id')
    const session_id = searchParams.get('session_id')

    if (!store_id || !session_id) {
      return NextResponse.json({ error: 'store_id dan session_id diperlukan' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: cart } = await supabase
      .from('carts')
      .select('id, voucher_code')
      .eq('store_id', store_id)
      .eq('session_id', session_id)
      .single()

    if (!cart) {
      return NextResponse.json({ cart: null, items: [] })
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        unit_price,
        products (id, name, sku, images)
      `)
      .eq('cart_id', cart.id)

    const subtotal = (items || []).reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    // Hitung diskon voucher jika ada
    let discount = 0
    let voucher = null
    if (cart.voucher_code) {
      const { data: v } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', store_id)
        .eq('code', cart.voucher_code)
        .eq('is_active', true)
        .single()
      
      if (v) {
        voucher = v
        if (v.type === 'PERCENT') {
          discount = subtotal * (v.value / 100)
          if (v.max_discount && discount > v.max_discount) discount = v.max_discount
        } else {
          discount = v.value
        }
      }
    }

    const total = Math.max(0, subtotal - discount)

    return NextResponse.json({
      cart: { ...cart, subtotal, discount, total, voucher },
      items: items || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { store_id, session_id } = await request.json()
    const supabase = await createClient()

    await supabase
      .from('carts')
      .delete()
      .eq('store_id', store_id)
      .eq('session_id', session_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
