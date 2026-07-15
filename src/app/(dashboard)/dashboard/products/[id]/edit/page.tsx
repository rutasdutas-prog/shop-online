import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditProductForm from './edit-form'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function EditProductPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ error?: string }> }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { user, store } = await requireStore()

  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('store_id', store.id)
    .single()

  if (!product) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('store_id', store.id)
    .order('name')

  return (
    <div className="max-w-2xl space-y-5">
      <EditProductForm product={product} categories={categories || []} error={searchParams?.error} />
    </div>
  )
}
