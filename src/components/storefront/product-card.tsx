'use client'

import { useState } from 'react'
import ProductDetailModal from './product-detail-modal'
import { ProductVariantPicker } from './product-variant-picker'
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

  const productVariants: any[] = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : []
  const hasVariants = productVariants.length > 0
  const hasImage = Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string'
  const price = product.price || 0
  const discount = product.discount_price || 0
  const hasDiscount = !hasVariants && discount > 0 && discount < price
  const minVariantPrice = hasVariants ? Math.min(...productVariants.map((v: any) => v.discount_price ? Number(v.discount_price) : Number(v.price))) : 0
  const displayPrice = hasVariants ? minVariantPrice : (hasDiscount ? discount : price)
  const percentOff = hasDiscount ? Math.round((1 - discount / price) * 100) : 0
  const stock = hasVariants ? productVariants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : (product.stock ?? null)
  const isOutOfStock = stock !== null && stock <= 0

  return (
    <>
      <div 
        className={`group bg-white ${cornerStyle} overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-zinc-100 flex flex-col h-full relative cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Badge Diskon */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow">
              -{percentOff}%
            </span>
          </div>
        )}

        {/* Badge Habis */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-zinc-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">
              {dict.storefront.outOfStock}
            </span>
          </div>
        )}

        {/* Image */}
        <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
          {hasImage ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-300 gap-3">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 md:p-4 flex-1 flex flex-col">
          <h3 className="text-xs md:text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug mb-1.5 md:mb-3 min-h-[36px] md:min-h-[44px] group-hover:text-[var(--theme-color)] transition-colors" style={{ '--theme-color': themeColor } as any}>{product.name}</h3>
          
          <div className="mt-auto">
            {/* Price */}
            <div className="flex flex-col gap-0.5 mt-2">
              {hasDiscount && (
                <span className="text-[10px] text-zinc-400 line-through font-medium">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              )}
              <span className="text-sm md:text-lg font-extrabold tracking-tight" style={{ color: isOutOfStock ? '#a1a1aa' : themeColor }}>
                {hasVariants ? 'Mulai ' : ''}Rp {displayPrice.toLocaleString('id-ID')}
              </span>
              {hasVariants && (
                <span className="text-[10px] text-zinc-400">{productVariants.length} varian</span>
              )}
            </div>
            
            {/* CTA Button — full width on all screens */}
            <div className="mt-2" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
              {hasVariants ? (
                <button 
                  className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {lang === 'id' ? 'Pilih Varian' : 'Select Variant'}
                </button>
              ) : isOutOfStock ? (
                <button disabled className="w-full text-zinc-400 bg-zinc-100 text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg cursor-not-allowed">
                  {dict.storefront.outOfStock}
                </button>
              ) : store.whatsapp ? (
                <a
                  href={`https://wa.me/62${store.whatsapp}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk: *${product.name}* (Rp ${displayPrice.toLocaleString('id-ID')})`)}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  {lang === 'id' ? 'Pesan' : 'Order'}
                </a>
              ) : (
                <AddToCartButton 
                  productId={product.id}
                  productName={product.name}
                  price={displayPrice}
                  image={product.images?.[0]}
                  className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
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
