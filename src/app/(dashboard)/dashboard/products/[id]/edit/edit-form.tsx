'use client'

import { useState } from 'react'
import { updateProduct, deleteProduct } from '@/actions/product.actions'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ImageSortableGallery, { PreviewItem } from '@/components/storefront/image-sortable-gallery'

export default function EditProductForm({ product, error }: { product: any, error?: string }) {
  const [previews, setPreviews] = useState<PreviewItem[]>(
    (product.images || []).map((url: string, i: number) => ({ 
      id: `existing-${i}`,
      url, 
      type: url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg', 
      name: url.split('/').pop() || '', 
      isExisting: true 
    }))
  )
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const router = useRouter()
  const hasVariants = Boolean(product.variants?.length)
  
  const [basePrice, setBasePrice] = useState(product.price?.toString() || '')
  const [discountType, setDiscountType] = useState<'FIX' | 'PERCENT'>('FIX')
  const [discountInput, setDiscountInput] = useState(product.discount_price?.toString() || '')
  
  const finalDiscountPrice = (() => {
    if (!discountInput) return ''
    if (discountType === 'FIX') return discountInput.replace(/\./g, '')
    const base = parseFloat(basePrice.replace(/\./g, '').replace(',', '.') || '0')
    const perc = parseFloat(discountInput)
    if (isNaN(base) || isNaN(perc)) return ''
    return Math.floor(base - (base * (perc / 100))).toString()
  })()

  const handleDeletedImage = (url: string) => {
    setDeletedImages(prev => [...prev, url])
  }

  const formAction = async (formData: FormData) => {
    formData.delete('files')
    previews.forEach(p => {
      if (p.file) {
        formData.append('files', p.file)
      }
    })
    
    const finalOrder = previews.map(p => ({
      isExisting: !!p.isExisting,
      url: p.isExisting ? p.url : p.name
    }))
    formData.append('final_image_order', JSON.stringify(finalOrder))
    
    await updateProduct(formData)
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors">
            ← Kembali
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Edit Produk</h1>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
              await deleteProduct(product.id)
              router.push('/dashboard/products')
              router.refresh()
            }
          }}
          className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Hapus Produk
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {decodeURIComponent(error)}
        </div>
      )}

      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="existing_images" value={JSON.stringify((product.images || []))} />
      {deletedImages.map(img => (
        <input key={img} type="hidden" name="deleted_images" value={img} />
      ))}
      
      <ImageSortableGallery previews={previews} setPreviews={setPreviews} onDeleted={handleDeletedImage} />

      {/* Informasi Produk */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-700">Informasi Produk</h2>
        
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-zinc-600">Nama Produk <span className="text-red-500">*</span></Label>
          <input id="name" name="name" required defaultValue={product.name}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sku" className="text-xs font-medium text-zinc-600">SKU / GTIN <span className="text-zinc-400 font-normal">(Opsional)</span></Label>
            <input id="sku" name="sku" defaultValue={product.sku || ''} placeholder="Masukkan SKU atau GTIN"
              className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-medium text-zinc-600">Status <span className="text-red-500">*</span></Label>
            <select name="status" required defaultValue={product.status || 'ACTIVE'}
              className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors bg-white">
              <option value="ACTIVE">Aktif</option>
              <option value="DRAFT">Draft / Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Harga & Diskon — hidden when has variants */}
        {!hasVariants && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-medium text-zinc-600">Harga <span className="text-red-500">*</span></Label>
              <div className="flex items-center h-9 border border-zinc-200 rounded-lg overflow-hidden focus-within:border-zinc-400 transition-colors">
                <span className="px-3 text-xs text-zinc-400 bg-zinc-50 border-r border-zinc-200 h-full flex items-center">Rp</span>
                <input id="price" required type="text" value={basePrice}
                  onChange={e => { const val = e.target.value.replace(/\D/g, ''); setBasePrice(val ? parseInt(val).toLocaleString('id-ID') : '') }}
                  className="flex-1 px-3 text-sm outline-none bg-transparent" />
                <input type="hidden" name="price" value={basePrice.replace(/\./g, '')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_input" className="text-xs font-medium text-zinc-600">Diskon <span className="text-zinc-400 font-normal">(Opsional)</span></Label>
              <div className="flex items-center h-9 border border-zinc-200 rounded-lg overflow-hidden focus-within:border-zinc-400 transition-colors">
                <select className="px-2 text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200 h-full outline-none" value={discountType}
                  onChange={e => setDiscountType(e.target.value as 'FIX' | 'PERCENT')}>
                  <option value="FIX">Rp</option>
                  <option value="PERCENT">%</option>
                </select>
                <input id="discount_input" type="text" value={discountInput}
                  onChange={e => {
                    if (discountType === 'FIX') { const val = e.target.value.replace(/\D/g, ''); setDiscountInput(val ? parseInt(val).toLocaleString('id-ID') : '') }
                    else setDiscountInput(e.target.value.replace(/[^0-9.]/g, ''))
                  }}
                  className="flex-1 px-3 text-sm outline-none bg-transparent" />
                <input type="hidden" name="discount_price" value={finalDiscountPrice} />
              </div>
              {discountType === 'PERCENT' && discountInput && (
                <p className="text-[10px] text-zinc-500">Harga akhir: Rp {parseInt(finalDiscountPrice || '0').toLocaleString('id-ID')}</p>
              )}
            </div>
          </div>
        )}

        {/* Stok — hidden when has variants */}
        {!hasVariants && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-xs font-medium text-zinc-600">Stok <span className="text-red-500">*</span></Label>
              <input id="stock" name="stock" type="number" required min="0" defaultValue={product.stock}
                className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-medium text-zinc-600">Deskripsi Produk <span className="text-red-500">*</span></Label>
          <textarea id="description" name="description" rows={6} defaultValue={product.description || ''}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors resize-none" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/dashboard/products" className="text-sm text-zinc-500 hover:text-zinc-700 px-4 py-2.5 rounded-lg border border-zinc-200 transition-colors">
          Batal
        </Link>
        <button
          type="submit"
          className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Simpan Perubahan
        </button>
      </div>
    </form>
  )
}
