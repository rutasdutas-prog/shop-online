import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { InventoryExportButtons } from '@/components/inventory/inventory-export-buttons'
import { InventoryRow } from '@/components/inventory/inventory-row'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { user, store } = await requireStore()

  
  const lang = await getLanguage()
  const dict = dictionaries[lang]

  // Ambil produk dengan stok dan variannya
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, images, stock, variants')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const items = (products || []).map(p => {
    const productVariants: any[] = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : []
    const hasVariants = productVariants.length > 0
    
    // Jika ada varian, jumlahkan stok semua varian. Jika tidak, gunakan stok produk utama.
    const totalStock = hasVariants 
      ? productVariants.reduce((s: number, v: any) => s + (parseInt(v.stock) || 0), 0) 
      : (p.stock || 0)
      
    const threshold = 5 // Ambang batas stok rendah
    
    return {
      ...p,
      has_variants: hasVariants,
      stock_level: totalStock,
      low_stock_threshold: threshold,
      is_low: totalStock <= threshold,
    }
  })

  const lowStockCount = items.filter(i => i.is_low).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{dict.inventory.title}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{dict.inventory.subtitle}</p>
        </div>
        <InventoryExportButtons
          items={items.map(i => ({
            id: i.id,
            name: i.name,
            sku: i.sku,
            images: i.images,
            stock_level: i.stock_level,
            is_low: i.is_low,
            variants: i.variants,
          }))}
          filename="Inventaris_Produk"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="text-xs text-zinc-400 mb-1">{dict.dashboard.overviewTotalProducts}</div>
          <div className="text-xl font-semibold text-zinc-900">{items.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="text-xs text-zinc-400 mb-1">Total Stok</div>
          <div className="text-xl font-semibold text-zinc-900">{items.reduce((s, i) => s + i.stock_level, 0)}</div>
        </div>
        <div className={`rounded-xl border p-4 ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-zinc-100'}`}>
          <div className={`text-xs mb-1 ${lowStockCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>Stok Rendah</div>
          <div className={`text-xl font-semibold ${lowStockCount > 0 ? 'text-red-600' : 'text-zinc-900'}`}>{lowStockCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-sm font-medium text-zinc-600">{dict.storefront.noProducts}</p>
            <p className="text-xs text-zinc-400 mt-1">Tambahkan produk terlebih dahulu</p>
            <Link href="/dashboard/products/new" className="inline-block mt-4 text-xs bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
              + {dict.dashboard.qaAddProduct}
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Produk</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">SKU</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500">Stok</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <InventoryRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
