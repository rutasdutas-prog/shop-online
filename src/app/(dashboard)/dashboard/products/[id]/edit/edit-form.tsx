'use client'

import { useRef, useState } from 'react'
import { updateProduct, deleteProduct } from '@/actions/product.actions'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function EditProductForm({ product, error }: { product: any, error?: string }) {
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string, isExisting?: boolean, file?: File }[]>(
    (product.images || []).map((url: string) => ({ url, type: url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg', name: url.split('/').pop() || '', isExisting: true }))
  )
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [basePrice, setBasePrice] = useState(product.price?.toString() || '')
  const [discountType, setDiscountType] = useState<'FIX' | 'PERCENT'>('FIX')
  const [discountInput, setDiscountInput] = useState(product.discount_price?.toString() || '')
  
  const finalDiscountPrice = (() => {
    if (!discountInput) return ''
    if (discountType === 'FIX') return discountInput
    const base = parseFloat(basePrice.replace(/\./g, '').replace(',', '.') || '0')
    const perc = parseFloat(discountInput)
    if (isNaN(base) || isNaN(perc)) return ''
    return Math.floor(base - (base * (perc / 100))).toString()
  })()

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
    const maxMB = 5

    const newPreviews: { url: string; type: string; name: string, file: File }[] = []
    
    // Count current state
    let currentPhotos = previews.filter(p => p.type.startsWith('image')).length
    let currentVideos = previews.filter(p => p.type.startsWith('video')).length

    for (const file of Array.from(fileList)) {
      if (!allowed.includes(file.type)) {
        alert(`Format tidak didukung: ${file.name}. Gunakan JPG, PNG, atau MP4.`)
        continue
      }
      if (file.size > maxMB * 1024 * 1024) {
        alert(`File terlalu besar: ${file.name}. Maksimal 5MB.`)
        continue
      }
      
      const isVideo = file.type.startsWith('video')
      if (isVideo) {
        if (currentVideos >= 1) {
          alert('Maksimal hanya 1 video yang diperbolehkan.')
          continue
        }
        currentVideos++
      } else {
        if (currentPhotos >= 10) {
          alert('Maksimal hanya 10 foto yang diperbolehkan.')
          continue
        }
        currentPhotos++
      }

      newPreviews.push({ url: URL.createObjectURL(file), type: file.type, name: file.name, file })
    }
    setPreviews(p => [...p, ...newPreviews])
  }

  const removePreview = (index: number) => {
    const previewToRemove = previews[index]
    if (previewToRemove.isExisting) {
      setDeletedImages(prev => [...prev, previewToRemove.url])
    }
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const formAction = async (formData: FormData) => {
    formData.delete('files')
    previews.forEach(p => {
      if (p.file) {
        formData.append('files', p.file)
      }
    })
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

      {/* Upload Area */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-700 mb-4">Foto & Video Produk</h2>
        
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        >
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm font-medium text-zinc-700">Klik atau drag & drop file di sini</p>
          <p className="text-xs text-zinc-400 mt-1">JPG, PNG, MP4 · Maks. 5MB per file</p>
          <input
            ref={fileInputRef}
            type="file"
            name="files"
            multiple
            accept=".jpg,.jpeg,.png,.mp4"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>

        {/* Preview Grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {previews.map((p, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                {p.type === 'video/mp4' ? (
                  <video src={p.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                {p.type === 'video/mp4' && (
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">MP4</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informasi Produk */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-700">Informasi Produk</h2>
        
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-zinc-600">Nama Produk</Label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product.name}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sku" className="text-xs font-medium text-zinc-600">
              SKU <span className="text-zinc-400 font-normal">(Opsional)</span>
            </Label>
            <input
              id="sku"
              name="sku"
              defaultValue={product.sku || ''}
              className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-medium text-zinc-600">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={product.status}
              className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors"
            >
              <option value="PUBLISHED">Aktif</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-xs font-medium text-zinc-600">Harga (Rp)</Label>
            <div className="flex items-center h-9 border border-zinc-200 rounded-lg overflow-hidden focus-within:border-zinc-400 transition-colors">
              <span className="px-3 text-xs text-zinc-400 bg-zinc-50 border-r border-zinc-200 h-full flex items-center">Rp</span>
              <input
                id="price"
                name="price"
                required
                defaultValue={product.price}
                onChange={e => setBasePrice(e.target.value)}
                inputMode="numeric"
                className="flex-1 px-3 text-sm outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount_input" className="text-xs font-medium text-zinc-600">
              Diskon <span className="text-zinc-400 font-normal">(Opsional)</span>
            </Label>
            <div className="flex items-center h-9 border border-zinc-200 rounded-lg overflow-hidden focus-within:border-zinc-400 transition-colors">
              <select 
                className="px-2 text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200 h-full outline-none"
                value={discountType}
                onChange={e => setDiscountType(e.target.value as 'FIX' | 'PERCENT')}
              >
                <option value="FIX">Rp</option>
                <option value="PERCENT">%</option>
              </select>
              <input
                id="discount_input"
                name="discount_input"
                defaultValue={product.discount_price || ''}
                onChange={e => setDiscountInput(e.target.value)}
                inputMode="numeric"
                className="flex-1 px-3 text-sm outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <input type="hidden" name="discount_price" value={finalDiscountPrice} />
            {discountType === 'PERCENT' && discountInput && (
              <p className="text-[10px] text-zinc-500">Harga akhir: Rp {parseInt(finalDiscountPrice || '0').toLocaleString('id-ID')}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-medium text-zinc-600">Deskripsi Produk</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description || ''}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end">
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
