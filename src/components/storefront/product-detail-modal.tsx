'use client'

import { useState, useEffect } from 'react'
import { AddToCartButton } from './add-to-cart-button'
import { ProductVariantPicker } from './product-variant-picker'

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

  // Reset active image when product changes
  useEffect(() => {
    setActiveImage(0)
  }, [product?.id])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : []
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  const productVariants = hasVariants ? product.variants : []
  
  const price = product.price || 0
  const discount = product.discount_price || 0
  const hasDiscount = !hasVariants && discount > 0 && discount < price
  const minVariantPrice = hasVariants ? Math.min(...productVariants.map((v: any) => v.price)) : 0
  const displayPrice = hasVariants ? minVariantPrice : (hasDiscount ? discount : price)
  
  const stock = hasVariants ? productVariants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : (product.stock ?? null)
  const isOutOfStock = stock !== null && stock <= 0
  const percentOff = hasDiscount ? Math.round((1 - discount / price) * 100) : 0

  const description = product.description || (lang === 'id' ? 'Tidak ada deskripsi.' : 'No description.')
  const descriptionLines = description.split(/\n/)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button Mobile */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-zinc-900 shadow-sm border border-zinc-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Close Button Desktop */}
        <button 
          onClick={onClose}
          className="hidden md:flex absolute top-4 right-4 z-50 w-8 h-8 items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-50 border-r border-zinc-100 relative">
          
          {/* Main Image */}
          <div className="w-full aspect-square md:aspect-[4/5] bg-zinc-100 relative">
            {images.length > 0 ? (
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-medium uppercase tracking-wider">No Image</span>
              </div>
            )}
            
            {hasDiscount && !isOutOfStock && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  -{percentOff}%
                </span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-zinc-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  Habis
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-t border-zinc-100 bg-white">
              {images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === idx ? 'border-[var(--theme-color)]' : 'border-transparent'}`}
                  style={{ '--theme-color': themeColor } as React.CSSProperties}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {activeImage === idx && <div className="absolute inset-0 bg-black/10" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & CTA */}
        <div className="w-full md:w-1/2 flex flex-col h-full max-h-[50vh] md:max-h-none bg-white">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto no-scrollbar">
            
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 leading-snug mb-3">
              {product.name}
            </h1>
            
            <div className="flex items-end gap-3 mb-6">
              {hasDiscount && (
                <span className="text-sm text-zinc-400 line-through font-medium">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              )}
              <span className="text-2xl font-extrabold tracking-tight" style={{ color: isOutOfStock ? '#a1a1aa' : themeColor }}>
                {hasVariants ? 'Mulai ' : ''}Rp {displayPrice.toLocaleString('id-ID')}
              </span>
            </div>

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

          {/* Bottom Fixed CTA Area */}
          <div className="p-4 md:p-6 border-t border-zinc-100 bg-white md:rounded-br-2xl shrink-0">
            {hasVariants ? (
              <ProductVariantPicker 
                variants={productVariants} 
                productName={product.name} 
                themeColor={themeColor} 
                lang={lang} 
              />
            ) : isOutOfStock ? (
              <button disabled className="w-full text-zinc-400 bg-zinc-100 text-sm md:text-base font-semibold py-3.5 rounded-xl cursor-not-allowed">
                {lang === 'id' ? 'Stok Habis' : 'Out of Stock'}
              </button>
            ) : store.whatsapp ? (
              <a
                href={`https://wa.me/62${store.whatsapp}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk: *${product.name}* (Rp ${displayPrice.toLocaleString('id-ID')})`)}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 text-white text-sm md:text-base font-semibold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5 hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                {lang === 'id' ? 'Pesan via WhatsApp' : 'Order via WhatsApp'}
              </a>
            ) : (
              <AddToCartButton 
                productName={product.name}
                className="w-full flex items-center justify-center gap-2 text-white text-sm md:text-base font-semibold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5 hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {lang === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart'}
              </AddToCartButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
