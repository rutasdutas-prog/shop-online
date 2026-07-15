import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

async function createCategory(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { user, store } = await requireStore()
  if (!user) return

    if (!store) return

  const name = formData.get('name') as string
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  await supabase.from('categories').insert({
    store_id: store.id,
    name,
    slug
  })
  revalidatePath('/dashboard/categories')
}

async function deleteCategory(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  await supabase.from('categories').delete().eq('id', id)
  revalidatePath('/dashboard/categories')
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { user, store } = await requireStore()

    const { data: categories } = store
    ? await supabase.from('categories').select('*, products(count)').eq('store_id', store.id).order('name')
    : { data: [] }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Kategori Produk</h1>
        <span className="text-sm text-zinc-500">{categories?.length || 0} kategori</span>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">Tambah Kategori Baru</h2>
        <form action={createCategory} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Nama Kategori *</label>
            <input name="name" required placeholder="Contoh: Sepatu Sneakers" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <button type="submit" className="bg-zinc-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors whitespace-nowrap">
            + Tambah
          </button>
        </form>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        {!categories?.length ? (
          <div className="py-16 text-center text-zinc-400">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm">Belum ada kategori. Silakan buat satu!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Nama Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Slug URL</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Jumlah Produk</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {categories?.map((c: any) => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.products?.[0]?.count || 0} produk</td>
                  <td className="px-4 py-3">
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-xs text-red-500 hover:text-red-700 border border-red-100 px-2 py-1 rounded-lg transition-colors">
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
