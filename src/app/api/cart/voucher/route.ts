import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/cart/voucher — Apply or remove voucher
// Body: { store_id, session_id, code } — kirim code: null untuk hapus voucher

export async function POST(request: Request) {
  try {
    const { store_id, session_id, code } = await request.json()
    const supabase = await createClient()

    // Hapus voucher
    if (!code) {
      await supabase
        .from('carts')
        .update({ voucher_code: null })
        .eq('store_id', store_id)
        .eq('session_id', session_id)
      return NextResponse.json({ success: true, message: 'Voucher dihapus dari cart.' })
    }

    // Cari voucher
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('store_id', store_id)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (!voucher) {
      return NextResponse.json({ error: 'Kode voucher tidak ditemukan atau tidak aktif.' }, { status: 400 })
    }

    // Cek masa berlaku
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher sudah kadaluarsa.' }, { status: 400 })
    }

    // Cek batas pemakaian
    if (voucher.max_uses && voucher.used_count >= voucher.max_uses) {
      return NextResponse.json({ error: 'Voucher sudah mencapai batas pemakaian.' }, { status: 400 })
    }

    // Ambil subtotal cart untuk cek minimum pembelian
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('store_id', store_id)
      .eq('session_id', session_id)
      .single()

    if (!cart) {
      return NextResponse.json({ error: 'Cart tidak ditemukan.' }, { status: 404 })
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select('quantity, unit_price')
      .eq('cart_id', cart.id)

    const subtotal = (items || []).reduce((s, i) => s + i.unit_price * i.quantity, 0)

    if (voucher.min_purchase && subtotal < voucher.min_purchase) {
      return NextResponse.json({
        error: `Minimum pembelian Rp ${voucher.min_purchase.toLocaleString('id-ID')} untuk menggunakan voucher ini.`
      }, { status: 400 })
    }

    // Terapkan voucher ke cart
    await supabase
      .from('carts')
      .update({ voucher_code: code.toUpperCase() })
      .eq('store_id', store_id)
      .eq('session_id', session_id)

    // Hitung diskon
    let discount = 0
    if (voucher.type === 'PERCENT') {
      discount = subtotal * (voucher.value / 100)
      if (voucher.max_discount && discount > voucher.max_discount) discount = voucher.max_discount
    } else {
      discount = voucher.value
    }

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discount
      },
      message: `✅ Voucher **${voucher.code}** berhasil diterapkan! Anda hemat Rp ${discount.toLocaleString('id-ID')}.`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
