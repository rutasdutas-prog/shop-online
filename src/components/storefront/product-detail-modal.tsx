'use client'

import { useState, useEffect } from 'react'

interface Variant {
  name: string
  price: number
  discount_price?: number
  stock: number
  imageUrl?: string
}

interface ProductDetailModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  store: any
  themeColor: string
  lang: 'id' | 'en'
  storeId?: string
}

export default function ProductDetailModal({ isOpen, onClose, product, store, themeColor, lang, storeId }: ProductDetailModalProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)

  useEffect(() => {
    setActiveImage(0)
    setSelectedVariant(null)
  }, [product?.id])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen || !product) return null

  const images: string[] = Array.isArray(product.images) && product.images.length > 0 ? product.images : []
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  const productVariants: Variant[] = hasVariants ? product.variants : []
  const activeVariant = selectedVariant !== null ? productVariants[selectedVariant] : null

  const minVariantPrice = hasVariants ? Math.min(...productVariants.map(v => v.discount_price ? Number(v.discount_price) : (Number(v.price) || 0))) : 0
  const basePrice = hasVariants
    ? (activeVariant ? Number(activeVariant.price) : minVariantPrice)
    : Number(product.price) || 0
  const discountPrice = hasVariants
    ? (activeVariant?.discount_price ? Number(activeVariant.discount_price) : null)
    : (product.discount_price ? Number(product.discount_price) : null)
  const hasDiscount = discountPrice !== null && discountPrice > 0 && discountPrice < basePrice
  const displayPrice = hasDiscount ? discountPrice! : basePrice
  const percentOff = hasDiscount ? Math.round((1 - displayPrice / basePrice) * 100) : 0

  const stock = hasVariants
    ? (activeVariant ? activeVariant.stock : productVariants.reduce((s, v) => s + (v.stock || 0), 0))
    : (product.stock ?? null)
  const isOutOfStock = stock !== null && stock <= 0

  const displayImage = (() => {
    if (activeVariant?.imageUrl && activeVariant.imageUrl.startsWith('http')) {
      return activeVariant.imageUrl
    }
    return images[activeImage] || null
  })()

  const description = product.description || (lang === 'id' ? 'Tidak ada deskripsi.' : 'No description.')
  const descriptionLines = description.split(/\n/)

  const handleSelectVariant = (idx: number) => {
    const variant = productVariants[idx]
    if (variant.stock <= 0) return
    setSelectedVariant(idx === selectedVariant ? null : idx)
  }

  const handleAddToCart = () => {
    if (hasVariants && selectedVariant === null) {
      alert(lang === 'id' ? 'Pilih varian terlebih dahulu!' : 'Please select a variant first!')
      return
    }
    const variantName = activeVariant?.name
    const price = displayPrice
    const image = displayImage || (product.images?.[0]) || undefined
    window.dispatchEvent(new CustomEvent('cart-direct-add', {
      detail: {
        productId: product.id,
        productName: product.name,
        variantName,
        price,
        image,
        quantity: 1
      }
    }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity cursor-pointer" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full h-[85vh] md:h-auto md:max-h-[90vh] max-w-full md:max-w-4xl bg-white md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200" style={{ width: '100%' }}>
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="md:hidden absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-zinc-700 shadow-sm border border-zinc-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Close Button Desktop */}
        <button onClick={onClose} className="hidden md:flex absolute top-4 right-4 z-50 w-8 h-8 items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-500 hover:text-zinc-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-100">
          <div className="w-full aspect-square relative bg-white">
            {displayImage ? (
              <img
                key={displayImage}
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-400">
                <svg className="w-16 h-16 mb-2 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-medium">No Image</span>
              </div>
            )}
            {hasDiscount && !isOutOfStock && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">-{percentOff}%</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-zinc-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">Habis</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar bg-white">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => { setActiveImage(idx); setSelectedVariant(null) }}
                  className={`relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                    !activeVariant?.imageUrl && activeImage === idx
                      ? 'border-[var(--theme-color)]'
                      : 'border-transparent hover:border-zinc-300'
                  }`}
                  style={{ '--theme-color': themeColor } as React.CSSProperties}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-white">
          <div className="p-5 md:p-8 flex-1 overflow-y-auto no-scrollbar">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 leading-tight mb-2 pr-6 md:pr-0">{product.name}</h1>
            
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: isOutOfStock ? '#a1a1aa' : themeColor }}>
                Rp {(hasVariants && selectedVariant === null ? minVariantPrice : displayPrice).toLocaleString('id-ID')}
              </span>
              {hasDiscount && (
                <span className="text-sm line-through font-medium text-zinc-400 mb-1">
                  Rp {basePrice.toLocaleString('id-ID')}
                </span>
              )}
            </div>

            <div className="mb-6 pb-6 border-b border-zinc-100">
              <span className="text-sm text-zinc-500">
                Stok: <span className={`font-semibold ${isOutOfStock ? 'text-red-500' : 'text-zinc-800'}`}>{stock}</span>
              </span>
            </div>

            {hasVariants && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-zinc-900 mb-3">
                  {lang === 'id' ? 'Pilih Varian' : 'Select Variant'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {productVariants.map((v, idx) => {
                    const outOfStock = v.stock <= 0
                    const isSelected = selectedVariant === idx
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !outOfStock && handleSelectVariant(idx)}
                        disabled={outOfStock}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-zinc-50'
                            : outOfStock
                            ? 'text-zinc-400 bg-zinc-50 cursor-not-allowed'
                            : 'text-zinc-700 hover:border-zinc-300'
                        }`}
                        style={isSelected ? { borderColor: themeColor, color: themeColor } : outOfStock ? { borderColor: '#e4e4e7' } : { borderColor: '#e4e4e7' }}
                      >
                        {v.imageUrl && v.imageUrl.startsWith('http') && (
                          <img
                            src={v.imageUrl}
                            alt={v.name}
                            className={`w-8 h-8 rounded object-cover flex-shrink-0 ${outOfStock ? 'opacity-50 grayscale' : ''}`}
                          />
                        )}
                        <span className="truncate">{v.name}</span>
                        {outOfStock && (
                          <span className="text-[10px] bg-zinc-200 text-zinc-500 px-1 rounded ml-auto">
                            Habis
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">
                {lang === 'id' ? 'Deskripsi Produk' : 'Product Description'}
              </h3>
              <div className="text-sm leading-relaxed text-zinc-600 space-y-2">
                {descriptionLines.map((line: string, i: number) => (
                  <p key={i}>{line || <>&nbsp;</>}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="p-4 border-t border-zinc-100 bg-white">
            {isOutOfStock && selectedVariant !== null ? (
              <button disabled className="w-full bg-zinc-100 text-zinc-400 text-sm md:text-base font-semibold py-3 md:py-3.5 rounded-xl cursor-not-allowed">
                {lang === 'id' ? 'Stok Habis' : 'Out of Stock'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full flex items-center justify-center gap-2 text-white text-sm md:text-base font-semibold py-3 md:py-3.5 rounded-xl transition-all active:scale-95 shadow hover:shadow-md ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={!isOutOfStock ? { backgroundColor: hasVariants && selectedVariant === null ? '#71717a' : themeColor } : { backgroundColor: '#a1a1aa' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {hasVariants && selectedVariant === null
                  ? (lang === 'id' ? 'Pilih Varian Dulu' : 'Select a Variant')
                  : (lang === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart')
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
