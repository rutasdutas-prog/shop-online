import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/cart/items — Tambah item ke cart (atau update qty jika sudah ada)
// Body: { store_id, session_id, product_id, quantity }

export async function POST(request: Request) {
  try {
    const { store_id, session_id, product_id, quantity = 1 } = await request.json()

    if (!store_id || !session_id || !product_id) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const supabase = await createClient()

    // Cek stok produk
    const { data: inventory } = await supabase
      .from('inventory')
      .select('stock_level')
      .eq('product_id', product_id)
      .single()

    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, discount_price, status')
      .eq('id', product_id)
      .eq('store_id', store_id)
      .eq('status', 'PUBLISHED')
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau tidak tersedia' }, { status: 404 })
    }

    const unitPrice = product.discount_price || product.price

    if (inventory && inventory.stock_level < quantity) {
      return NextResponse.json({ 
        error: `Stok tidak mencukupi. Tersisa ${inventory.stock_level} unit.` 
      }, { status: 400 })
    }

    // Buat atau ambil cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .upsert({ store_id, session_id }, { onConflict: 'store_id,session_id' })
      .select('id')
      .single()

    if (cartError || !cart) {
      // Coba ambil cart yang sudah ada
      const { data: existingCart } = await supabase
        .from('carts')
        .select('id')
        .eq('store_id', store_id)
        .eq('session_id', session_id)
        .single()

      if (!existingCart) {
        return NextResponse.json({ error: 'Gagal membuat cart' }, { status: 500 })
      }

      // Upsert item
      await supabase.from('cart_items').upsert({
        cart_id: existingCart.id,
        product_id,
        quantity,
        unit_price: unitPrice
      }, { onConflict: 'cart_id,product_id' })

      return NextResponse.json({ success: true, product_name: product.name })
    }

    // Upsert item ke cart
    await supabase.from('cart_items').upsert({
      cart_id: cart.id,
      product_id,
      quantity,
      unit_price: unitPrice
    }, { onConflict: 'cart_id,product_id' })

    return NextResponse.json({ success: true, product_name: product.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
