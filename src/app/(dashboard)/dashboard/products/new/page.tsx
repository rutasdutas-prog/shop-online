'use client'

import { useRef, useState, useEffect } from 'react'
import { createProduct, getCategories } from '@/actions/product.actions'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Variant {
  name: string
  price: string
  stock: string
  imageUrl: string
  imageFile?: File
}

export default function NewProductPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string; file?: File }[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [discountType, setDiscountType] = useState<'FIX' | 'PERCENT'>('FIX')
  const [discountInput, setDiscountInput] = useState('')
  const [variants, setVariants] = useState<Variant[]>([])
  const [hasVariants, setHasVariants] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const finalDiscountPrice = (() => {
    if (!discountInput) return ''
    if (discountType === 'FIX') return discountInput.replace(/\./g, '')
    const base = parseFloat(basePrice.replace(/\./g, '').replace(',', '.') || '0')
    const perc = parseFloat(discountInput)
    if (isNaN(base) || isNaN(perc)) return ''
    return Math.floor(base - base * (perc / 100)).toString()
  })()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
    const maxMB = 5
    const newPreviews: { url: string; type: string; name: string; file: File }[] = []
    let currentPhotos = previews.filter(p => p.type.startsWith('image')).length
    let currentVideos = previews.filter(p => p.type.startsWith('video')).length

    for (const file of Array.from(fileList)) {
      if (!allowed.includes(file.type)) { alert(`Format tidak didukung: ${file.name}. Gunakan JPG, PNG, atau MP4.`); continue }
      if (file.size > maxMB * 1024 * 1024) { alert(`File terlalu besar: ${file.name}. Maks. 5MB.`); continue }
      const isVideo = file.type.startsWith('video')
      if (isVideo) {
        if (currentVideos >= 1) { alert('Maksimal 1 video.'); continue }
        currentVideos++
      } else {
        if (currentPhotos >= 10) { alert('Maksimal 10 foto.'); continue }
        currentPhotos++
      }
      newPreviews.push({ url: URL.createObjectURL(file), type: file.type, name: file.name, file })
    }
    setPreviews(p => [...p, ...newPreviews])
  }

  const addVariant = () => {
    setVariants(v => [...v, { name: '', price: '', stock: '0', imageUrl: '' }])
  }

  const removeVariant = (idx: number) => {
    setVariants(v => v.filter((_, i) => i !== idx))
  }

  const updateVariant = (idx: number, field: keyof Variant, value: string) => {
    setVariants(v => v.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleVariantImage = (idx: number, file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setVariants(v => v.map((item, i) => i === idx ? { ...item, imageUrl: url, imageFile: file } : item))
  }

  const formAction = async (formData: FormData) => {
    formData.delete('files')
    previews.forEach(p => { if (p.file) formData.append('files', p.file) })
    // Attach variant images
    variants.forEach((v, idx) => {
      if (v.imageFile) formData.append(`variant_image_${idx}`, v.imageFile)
    })
    // Attach variants as JSON (without imageFile which can't be serialized)
    const variantsData = variants.map(({ imageFile, imageUrl, ...rest }) => ({
      ...rest,
      price: rest.price.replace(/\./g, ''),
      stock: rest.stock,
      imageUrl: ''  // will be replaced server-side
    }))
    formData.set('variants_json', JSON.stringify(variantsData))
    formData.set('has_variants', hasVariants ? '1' : '0')
    await createProduct(formData)
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors">
          ← Kembali
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Tambah Produk Baru</h1>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-4">

        {/* Upload Area */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-700 mb-4">Foto &amp; Video Produk</h2>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm font-medium text-zinc-700">Klik atau drag &amp; drop file di sini</p>
            <p className="text-xs text-zinc-400 mt-1">JPG, PNG, MP4 · Maks. 5MB per file</p>
            <input ref={fileInputRef} type="file" name="files" multiple accept=".jpg,.jpeg,.png,.mp4" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {previews.map((p, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                  {p.type === 'video/mp4' ? (
                    <video src={p.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  )}
                  <button type="button" onClick={() => setPreviews(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                  {p.type === 'video/mp4' && <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">MP4</div>}
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
            <input id="name" name="name" required placeholder="Contoh: Sepatu Sneakers Hitam"
              className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-xs font-medium text-zinc-600">SKU <span className="text-zinc-400 font-normal">(Opsional)</span></Label>
              <input id="sku" name="sku" placeholder="SNK-001"
                className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category_id" className="text-xs font-medium text-zinc-600">Kategori <span className="text-red-500">*</span></Label>
              <select name="category_id" required value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors bg-white">
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="NEW">+ Tambah Kategori Baru</option>
              </select>
              {selectedCategoryId === 'NEW' && (
                <input type="text" name="new_category_name" placeholder="Nama kategori baru..." required autoFocus
                  className="w-full h-9 mt-2 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
              )}
            </div>
          </div>

          {/* Harga & Diskon — hidden when has variants */}
          {!hasVariants && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-medium text-zinc-600">Harga (Rp)</Label>
                <div className="flex items-center h-9 border border-zinc-200 rounded-lg overflow-hidden focus-within:border-zinc-400 transition-colors">
                  <span className="px-3 text-xs text-zinc-400 bg-zinc-50 border-r border-zinc-200 h-full flex items-center">Rp</span>
                  <input id="price" required type="text" placeholder="150.000" value={basePrice}
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
                  <input id="discount_input" type="text" placeholder={discountType === 'FIX' ? '50.000' : '10'} value={discountInput}
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
                <Label htmlFor="stock" className="text-xs font-medium text-zinc-600">Stok Awal</Label>
                <input id="stock" name="stock" type="number" required min="0" defaultValue="0"
                  className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-zinc-600">Deskripsi Produk</Label>
            <textarea id="description" name="description" rows={4}
              placeholder="Tulis deskripsi detail produk: bahan, ukuran, warna, keunggulan..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors resize-none" />
          </div>
        </div>

        {/* Varian Produk */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-zinc-700">Varian Produk</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Contoh: Warna, Ukuran, Material</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-zinc-500">Aktifkan Varian</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={hasVariants} onChange={e => { setHasVariants(e.target.checked); if (!e.target.checked) setVariants([]) }} />
                <div className={`w-10 h-6 rounded-full transition-colors ${hasVariants ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${hasVariants ? 'left-5' : 'left-1'}`}></div>
              </div>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-700">Varian {idx + 1}</span>
                    <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600 text-xs transition-colors">× Hapus</button>
                  </div>

                  {/* Foto Varian */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">Foto Varian <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3">
                      {v.imageUrl ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 flex-shrink-0">
                          <img src={v.imageUrl} alt="variant" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => updateVariant(idx, 'imageUrl', '')}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                        </div>
                      ) : (
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors flex-shrink-0">
                          <span className="text-2xl">📷</span>
                          <span className="text-[10px] text-zinc-400 mt-1">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleVariantImage(idx, e.target.files?.[0] || null)} />
                        </label>
                      )}
                      <div className="flex-1 space-y-2">
                        <input type="text" placeholder="Nama varian (mis: Merah, L, Kayu Jati) *" required value={v.name}
                          onChange={e => updateVariant(idx, 'name', e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Harga (mis: 150000) *" required value={v.price}
                            onChange={e => { const val = e.target.value.replace(/\D/g, ''); updateVariant(idx, 'price', val ? parseInt(val).toLocaleString('id-ID') : '') }}
                            className="h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
                          <input type="number" placeholder="Stok *" min="0" required value={v.stock}
                            onChange={e => updateVariant(idx, 'stock', e.target.value)}
                            className="h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addVariant}
                className="w-full border-2 border-dashed border-zinc-200 rounded-xl py-3 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Tambah Varian
              </button>

              {variants.length === 0 && (
                <p className="text-center text-xs text-zinc-400 py-2">Belum ada varian. Klik tombol di atas untuk menambahkan.</p>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/products" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Batal</Link>
          <button type="submit" className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors">
            Simpan Produk →
          </button>
        </div>

      </form>
    </div>
  )
}
