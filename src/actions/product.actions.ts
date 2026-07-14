'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

async function uploadFile(supabase: any, file: File, storeId: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Format file tidak didukung: ${file.type}. Gunakan JPG, PNG, atau MP4.`)
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Ukuran file terlalu besar. Maksimal ${MAX_SIZE_MB}MB.`)
  }

  const ext = file.name.split('.').pop()
  const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('products')
    .upload(fileName, bytes, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload gagal: ${error.message}`)

  const { data } = supabase.storage.from('products').getPublicUrl(fileName)
  return data.publicUrl
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

  const name = formData.get('name') as string
  const sku = formData.get('sku') as string
  const description = formData.get('description') as string
  const hasVariants = formData.get('has_variants') === '1'

  // Parse price/discount only when no variants
  const priceRaw = ((formData.get('price') as string) || '0').replace(/\./g, '').replace(',', '.')
  const discountRaw = formData.get('discount_price') as string
  const price = hasVariants ? 0 : parseFloat(priceRaw) || 0
  const discount_price = (!hasVariants && discountRaw) ? parseFloat(discountRaw.replace(/\./g, '')) : null
  const stock = hasVariants ? 0 : (parseInt(formData.get('stock') as string) || 0)

  // Upload main product images
  const files = formData.getAll('files') as File[]
  const imageUrls: string[] = []
  for (const file of files) {
    if (file && file.size > 0) {
      try {
        const url = await uploadFile(supabase, file, store.id)
        imageUrls.push(url)
      } catch (err: any) {
        redirect(`/dashboard/products/new?error=${encodeURIComponent(err.message)}`)
      }
    }
  }

  // Handle variants
  let variants: any[] = []
  if (hasVariants) {
    const variantsJson = formData.get('variants_json') as string
    if (variantsJson) {
      const rawVariants = JSON.parse(variantsJson) as any[]
      for (let idx = 0; idx < rawVariants.length; idx++) {
        const vFile = formData.get(`variant_image_${idx}`) as File | null
        let vImageUrl = ''
        if (vFile && vFile.size > 0) {
          try { vImageUrl = await uploadFile(supabase, vFile, store.id) } catch {}
        }
        variants.push({
          name: rawVariants[idx].name,
          price: parseFloat(rawVariants[idx].price) || 0,
          discount_price: parseFloat(rawVariants[idx].discount_price) || null,
          stock: parseInt(rawVariants[idx].stock) || 0,
          imageUrl: vImageUrl,
        })
      }
    }
  }

  let category_id = formData.get('category_id') as string
  if (category_id === 'NEW') {
    const newCatName = formData.get('new_category_name') as string
    if (newCatName) {
      const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const { data: newCat } = await supabase.from('categories').insert({ store_id: store.id, name: newCatName, slug }).select('id').single()
      if (newCat) category_id = newCat.id
    }
  }

  const { error } = await supabase.from('products').insert({
    store_id: store.id,
    category_id: category_id === 'NEW' ? null : (category_id || null),
    name,
    sku: sku || null,
    price,
    discount_price,
    description,
    status: 'PUBLISHED',
    stock,
    images: imageUrls,
    variants,
  })

  if (error) {
    redirect(`/dashboard/products/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function getProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) return []

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
  return products || []
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const sku = formData.get('sku') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string || 'PUBLISHED'
  const hasVariants = formData.get('has_variants') === '1'

  const priceRaw = ((formData.get('price') as string) || '0').replace(/\./g, '').replace(',', '.')
  const discountRaw = formData.get('discount_price') as string
  const price = hasVariants ? 0 : parseFloat(priceRaw) || 0
  const discount_price = (!hasVariants && discountRaw) ? parseFloat(discountRaw.replace(/\./g, '')) : null
  const stock = hasVariants ? 0 : (parseInt(formData.get('stock') as string) || 0)

  // Delete existing images if needed
  const deletedImages = formData.getAll('deleted_images') as string[]
  let existingImages = JSON.parse(formData.get('existing_images') as string || '[]') as string[]
  existingImages = existingImages.filter(img => !deletedImages.includes(img))

  // Upload new files
  const files = formData.getAll('files') as File[]
  const imageUrls: string[] = [...existingImages]
  for (const file of files) {
    if (file && file.size > 0) {
      try {
        const url = await uploadFile(supabase, file, store.id)
        imageUrls.push(url)
      } catch (err: any) {
        redirect(`/dashboard/products/${id}/edit?error=${encodeURIComponent(err.message)}`)
      }
    }
  }

  // Handle variants
  let variants: any[] = []
  if (hasVariants) {
    const variantsJson = formData.get('variants_json') as string
    if (variantsJson) {
      const rawVariants = JSON.parse(variantsJson) as any[]
      for (let idx = 0; idx < rawVariants.length; idx++) {
        const vFile = formData.get(`variant_image_${idx}`) as File | null
        let vImageUrl = rawVariants[idx].imageUrl || ''
        if (vFile && vFile.size > 0) {
          try { vImageUrl = await uploadFile(supabase, vFile, store.id) } catch {}
        }
        variants.push({
          name: rawVariants[idx].name,
          price: parseFloat(rawVariants[idx].price) || 0,
          discount_price: parseFloat(rawVariants[idx].discount_price) || null,
          stock: parseInt(rawVariants[idx].stock) || 0,
          imageUrl: vImageUrl,
        })
      }
    }
  }

  const category_id = formData.get('category_id') as string

  const { error } = await supabase
    .from('products')
    .update({
      category_id: category_id || null,
      name,
      sku: sku || null,
      price,
      discount_price,
      description,
      status,
      stock,
      images: imageUrls,
      variants,
    })
    .eq('id', id)
    .eq('store_id', store.id)

  if (error) {
    redirect(`/dashboard/products/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) return { error: 'Store not found' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('store_id', store.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function getCategories() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) return []

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', store.id)
    .order('name')
  
  return categories || []
}
