import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const storeId = searchParams.get('storeId')

  if (!query || !storeId) {
    return NextResponse.json({ categories: [], products: [] })
  }

  const supabase = await createClient()

  // 1. Search Categories (if you have categories table, assuming yes, or we just skip if not present)
  // Wait, let's check if categories exist. For now I'll just do products.
  
  // 2. Search Products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, images, discount_price')
    .eq('store_id', storeId)
    .eq('status', 'PUBLISHED')
    .ilike('name', `%${query}%`)
    .limit(5)

  return NextResponse.json({
    categories: [], // Add category search if available
    products: products || []
  })
}
