import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/cart/items/[id] — Update quantity
// DELETE /api/cart/items/[id] — Hapus item dari cart

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { quantity } = await request.json()
    const supabase = await createClient()

    if (quantity <= 0) {
      await supabase.from('cart_items').delete().eq('id', id)
      return NextResponse.json({ success: true, deleted: true })
    }

    await supabase.from('cart_items').update({ quantity }).eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    await supabase.from('cart_items').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
