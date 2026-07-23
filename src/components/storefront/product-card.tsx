'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProductDetailModal from './product-detail-modal'
import { AddToCartButton } from './add-to-cart-button'

interface ProductCardProps {
  product: any
  store: any
  themeColor: string
  lang: 'id' | 'en'
  dict: any
  cornerStyle: string
}

export default function ProductCard({ product, store, themeColor, lang, dict, cornerStyle }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.product?.id === product.id) {
        setIsModalOpen(true)
      }
    }
    // Close this modal when another product is clicked
    const handleCloseAll = () => {
      setIsModalOpen(false)
    }
    window.addEventListener('open-product-modal', handleOpenModal)
    window.addEventListener('close-all-product-modals', handleCloseAll)
    return () => {
      window.removeEventListener('open-product-modal', handleOpenModal)
      window.removeEventListener('close-all-product-modals', handleCloseAll)
    }
  }, [product.id])

  const productVariants: any[] = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : []
  const hasVariants = productVariants.length > 0
  const hasImage = Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string'
  const price = product.price || 0
  const discount = product.discount_price || 0
  const hasDiscount = !hasVariants && discount > 0 && discount < price
  const minVariantPrice = hasVariants
    ? Math.min(...productVariants.map((v: any) => v.discount_price && Number(v.discount_price) > 0 && Number(v.discount_price) < Number(v.price) ? Number(v.discount_price) : Number(v.price)))
    : 0
  const maxVariantPrice = hasVariants
    ? Math.max(...productVariants.map((v: any) => Number(v.price)))
    : 0
  const hasVariantRange = hasVariants && maxVariantPrice > minVariantPrice
  const displayPrice = hasVariants ? minVariantPrice : (hasDiscount ? discount : price)
  const percentOff = hasDiscount ? Math.round((1 - discount / price) * 100) : 0
  const stock = hasVariants ? productVariants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : (product.stock ?? null)
  const isOutOfStock = stock !== null && stock <= 0

  return (
    <>
      <div 
        className={`group ${cornerStyle} overflow-hidden transition-all duration-300 flex flex-col h-full relative cursor-pointer`}
        style={{
          backgroundColor: 'rgba(15,14,25,0.8)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          opacity: isOutOfStock ? 0.65 : 1,
          willChange: 'transform',
        }}
        onClick={() => {
          // Close any other open modals first
          window.dispatchEvent(new CustomEvent('close-all-product-modals'))
          // Then open this one (React batches these state updates)
          setTimeout(() => setIsModalOpen(true), 0)
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = `${themeColor}50`
          el.style.boxShadow = `0 8px 40px rgba(0,0,0,0.5), 0 0 20px ${themeColor}20`
          el.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(255,255,255,0.10)'
          el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Discount Badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-lg" style={{ backgroundColor: themeColor }}>
              -{percentOff}%
            </span>
          </div>
        )}
        {/* Variant badge */}
        {hasVariants && !isOutOfStock && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full bg-black/60 text-white shadow-sm backdrop-blur-md border border-white/10">
              {productVariants.length} varian
            </span>
          </div>
        )}
        {/* Out of stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-zinc-700/80 text-white/70 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">
              {dict.storefront.outOfStock}
            </span>
          </div>
        )}

        {/* Image */}
        <div className="aspect-[4/5] bg-black/20 relative overflow-hidden">
          {hasImage ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
            </div>
          )}
          {/* Bottom fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
        </div>

        {/* Info */}
        <div className="p-2.5 md:p-4 flex-1 flex flex-col">
          <h3 className="text-xs md:text-sm font-semibold text-white/90 line-clamp-2 leading-snug mb-1.5 md:mb-3 min-h-[36px] md:min-h-[44px] transition-colors group-hover:text-white">
            {product.name}
          </h3>
          
          <div className="mt-auto">
            {/* Price */}
            <div className="flex flex-col gap-0.5 mb-2">
              {hasDiscount && (
                <span className="text-[10px] text-white/30 line-through font-medium">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              )}
              <span className="text-sm md:text-base font-extrabold tracking-tight" style={{ color: isOutOfStock ? 'rgba(255,255,255,0.3)' : themeColor }}>
                {hasVariants
                  ? hasVariantRange
                    ? `Rp ${minVariantPrice.toLocaleString('id-ID')} – Rp ${maxVariantPrice.toLocaleString('id-ID')}`
                    : `Rp ${minVariantPrice.toLocaleString('id-ID')}`
                  : `Rp ${displayPrice.toLocaleString('id-ID')}`
                }
              </span>
            </div>
            
            {/* CTA Button */}
            <div onClick={(e) => {
              e.stopPropagation()
              window.dispatchEvent(new CustomEvent('close-all-product-modals'))
              setTimeout(() => setIsModalOpen(true), 0)
            }}>
              {hasVariants ? (
                <button 
                  className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-xl transition-all active:scale-95"
                  style={{ 
                    backgroundColor: `${themeColor}25`,
                    border: `1px solid ${themeColor}50`,
                    color: themeColor
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {lang === 'id' ? 'Pilih Varian' : 'Select Variant'}
                </button>
              ) : isOutOfStock ? (
                <button disabled className="w-full text-white/30 bg-white/5 text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-xl cursor-not-allowed border border-white/10">
                  {dict.storefront.outOfStock}
                </button>
              ) : (
                <AddToCartButton 
                  productId={product.id}
                  productName={product.name}
                  price={displayPrice}
                  image={product.images?.[0]}
                  className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-xl transition-all active:scale-95 shadow"
                  style={{ backgroundColor: themeColor }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {lang === 'id' ? '+ Keranjang' : '+ Cart'}
                </AddToCartButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        store={store}
        themeColor={themeColor}
        lang={lang}
      />
    </>
  )
}
