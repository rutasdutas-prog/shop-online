import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditProductForm from './edit-form'

export const dynamic = 'force-dynamic'

export default async function EditProductPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ error?: string }> }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

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
