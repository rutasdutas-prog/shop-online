'use client'

import { useState, useEffect } from 'react'
import { AddToCartButton } from './add-to-cart-button'

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
}

export default function ProductDetailModal({ isOpen, onClose, product, store, themeColor, lang }: ProductDetailModalProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)

  // Reset when product changes
  useEffect(() => {
    setActiveImage(0)
    setSelectedVariant(null)
  }, [product?.id])

  // Prevent background scrolling
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

  // Selected variant data
  const activeVariant = selectedVariant !== null ? productVariants[selectedVariant] : null

  // Price calculation
  const minVariantPrice = hasVariants ? Math.min(...productVariants.map(v => Number(v.price) || 0)) : 0
  const basePrice = hasVariants
    ? (activeVariant ? Number(activeVariant.price) : minVariantPrice)
    : Number(product.price) || 0
  const discountPrice = hasVariants
    ? (activeVariant?.discount_price ? Number(activeVariant.discount_price) : null)
    : (product.discount_price ? Number(product.discount_price) : null)
  const hasDiscount = discountPrice !== null && discountPrice > 0 && discountPrice < basePrice
  const displayPrice = hasDiscount ? discountPrice! : basePrice
  const percentOff = hasDiscount ? Math.round((1 - displayPrice / basePrice) * 100) : 0

  // Stock
  const stock = hasVariants
    ? (activeVariant ? activeVariant.stock : productVariants.reduce((s, v) => s + (v.stock || 0), 0))
    : (product.stock ?? null)
  const isOutOfStock = stock !== null && stock <= 0

  // Active image — when a variant is selected and has its own image, switch to it
  const displayImage = (() => {
    if (activeVariant?.imageUrl && activeVariant.imageUrl.startsWith('http')) {
      return activeVariant.imageUrl
    }
    return images[activeImage] || null
  })()

  const description = product.description || (lang === 'id' ? 'Tidak ada deskripsi.' : 'No description.')
  const descriptionLines = description.split(/\n/)

  // Handle variant selection — also update main image if variant has one
  const handleSelectVariant = (idx: number) => {
    const variant = productVariants[idx]
    if (variant.stock <= 0) return
    setSelectedVariant(idx === selectedVariant ? null : idx)
    // Switch main image to variant image if exists
    if (variant.imageUrl && variant.imageUrl.startsWith('http')) {
      // We'll show the variant image via displayImage logic above
    }
  }

  const handleAddToCart = () => {
    if (hasVariants && selectedVariant === null) {
      alert(lang === 'id' ? 'Pilih varian terlebih dahulu!' : 'Please select a variant first!')
      return
    }
    const productLabel = hasVariants && activeVariant
      ? `${product.name} - ${activeVariant.name}`
      : product.name
    window.dispatchEvent(new CustomEvent('ai-cart-add', { detail: { productName: productLabel } }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Close Mobile */}
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-zinc-900 shadow-sm border border-zinc-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Close Desktop */}
        <button onClick={onClose} className="hidden md:flex absolute top-4 right-4 z-50 w-8 h-8 items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-50 border-r border-zinc-100 relative">

          {/* Main Image */}
          <div className="w-full aspect-square md:aspect-[4/5] bg-zinc-100 relative">
            {displayImage ? (
              <img
                key={displayImage}
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-contain transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-medium uppercase tracking-wider">No Image</span>
              </div>
            )}
            {hasDiscount && !isOutOfStock && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">-{percentOff}%</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-zinc-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">Habis</span>
              </div>
            )}
          </div>

          {/* Thumbnails (product gallery images) */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-t border-zinc-100 bg-white">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => { setActiveImage(idx); setSelectedVariant(null) }}
                  className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
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
        <div className="w-full md:w-1/2 flex flex-col h-full max-h-[50vh] md:max-h-none bg-white">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto no-scrollbar">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 leading-snug mb-3">{product.name}</h1>

            {/* Price */}
            <div className="flex items-end gap-3 mb-2">
              {hasDiscount && (
                <span className="text-sm text-zinc-400 line-through font-medium">
                  Rp {basePrice.toLocaleString('id-ID')}
                </span>
              )}
              <span className="text-2xl font-extrabold tracking-tight" style={{ color: isOutOfStock ? '#a1a1aa' : themeColor }}>
                {hasVariants && selectedVariant === null ? 'Mulai ' : ''}Rp {(hasVariants && selectedVariant === null ? minVariantPrice : displayPrice).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Stock indicator */}
            <div className="mb-6">
              {hasVariants && selectedVariant !== null && activeVariant && (
                <span className="text-xs text-zinc-500">
                  Stok{' '}
                  <span className={`font-semibold ${activeVariant.stock <= 5 ? 'text-red-500' : 'text-zinc-700'}`}>
                    {activeVariant.stock}
                  </span>
                </span>
              )}
              {!hasVariants && stock !== null && (
                <span className="text-xs text-zinc-500">
                  Stok <span className={`font-semibold ${stock <= 5 ? 'text-red-500' : 'text-zinc-700'}`}>{stock}</span>
                </span>
              )}
            </div>

            {/* Variant Picker */}
            {hasVariants && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  {lang === 'id' ? 'Pilih Varian' : 'Select Variant'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {productVariants.map((v, idx) => {
                    const outOfStock = v.stock <= 0
                    const isSelected = selectedVariant === idx
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !outOfStock && handleSelectVariant(idx)}
                        disabled={outOfStock}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg scale-[1.03]'
                            : outOfStock
                            ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {v.imageUrl && v.imageUrl.startsWith('http') && (
                          <img
                            src={v.imageUrl}
                            alt={v.name}
                            className={`w-7 h-7 rounded-lg object-cover flex-shrink-0 ${outOfStock ? 'opacity-40' : ''}`}
                          />
                        )}
                        <span>{v.name}</span>
                        {outOfStock && (
                          <span className="text-[10px] bg-zinc-200 text-zinc-400 px-1 rounded ml-1">
                            {lang === 'id' ? 'Habis' : 'Out'}
                          </span>
                        )}
                        {!outOfStock && v.discount_price && Number(v.discount_price) > 0 && (
                          <span className="text-[10px] bg-red-100 text-red-500 px-1 rounded ml-1">DISC</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="border-t border-zinc-100 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">
                {lang === 'id' ? 'Deskripsi Produk' : 'Product Description'}
              </h3>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                {descriptionLines.map((line: string, i: number) => (
                  <p key={i}>{line || <>&nbsp;</>}</p>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="p-4 md:p-6 border-t border-zinc-100 bg-white md:rounded-br-2xl shrink-0">
            {isOutOfStock && selectedVariant !== null ? (
              <button disabled className="w-full text-zinc-400 bg-zinc-100 text-sm md:text-base font-semibold py-3.5 rounded-xl cursor-not-allowed">
                {lang === 'id' ? 'Stok Habis' : 'Out of Stock'}
              </button>
            ) : store.whatsapp ? (
              <a
                href={`https://wa.me/62${store.whatsapp}?text=${encodeURIComponent(
                  hasVariants && activeVariant
                    ? `Halo, saya tertarik dengan produk: *${product.name}*\nVarian: *${activeVariant.name}*\nHarga: Rp ${displayPrice.toLocaleString('id-ID')}`
                    : `Halo, saya tertarik dengan produk: *${product.name}* (Rp ${displayPrice.toLocaleString('id-ID')})`
                )}`}
                target="_blank"
                onClick={e => {
                  if (hasVariants && selectedVariant === null) {
                    e.preventDefault()
                    alert(lang === 'id' ? 'Pilih varian terlebih dahulu!' : 'Please select a variant first!')
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-white text-sm md:text-base font-semibold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5 hover:opacity-90"
                style={{ backgroundColor: hasVariants && selectedVariant === null ? '#71717a' : themeColor }}
              >
                {hasVariants && selectedVariant === null
                  ? (lang === 'id' ? 'Pilih Varian Dulu' : 'Select a Variant First')
                  : (lang === 'id' ? 'Pesan via WhatsApp' : 'Order via WhatsApp')
                }
              </a>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full flex items-center justify-center gap-2 text-white text-sm md:text-base font-semibold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5 hover:opacity-90 ${isOutOfStock ? 'bg-zinc-300 cursor-not-allowed' : ''}`}
                style={!isOutOfStock ? { backgroundColor: hasVariants && selectedVariant === null ? '#71717a' : themeColor } : {}}
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
