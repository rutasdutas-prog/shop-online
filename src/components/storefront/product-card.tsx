'use client'

import { useState } from 'react'
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
        className="group rounded-xl overflow-hidden bg-white flex flex-col h-full relative cursor-pointer transition-all duration-200"
        style={{
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          opacity: isOutOfStock ? 0.7 : 1,
          border: '1px solid #f0f0f0',
        }}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.15), 0 0 0 2px ${themeColor}40`
          el.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Discount Badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow" style={{ backgroundColor: '#ee4d2d' }}>
              -{percentOff}%
            </span>
          </div>
        )}
        {/* Variant badge */}
        {hasVariants && !isOutOfStock && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-black/50 text-white">
              {productVariants.length} varian
            </span>
          </div>
        )}
        {/* Out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-xl">
            <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">Stok Habis</span>
          </div>
        )}

        {/* Image */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {hasImage ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-400 ease-out p-1"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 flex-1 flex flex-col gap-1">
          <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug min-h-[32px]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex flex-col mt-1">
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through">
                Rp {price.toLocaleString('id-ID')}
              </span>
            )}
            <span className="text-sm font-bold" style={{ color: isOutOfStock ? '#aaa' : '#ee4d2d' }}>
              {hasVariants
                ? hasVariantRange
                  ? `Rp ${minVariantPrice.toLocaleString('id-ID')} – Rp ${maxVariantPrice.toLocaleString('id-ID')}`
                  : `Rp ${minVariantPrice.toLocaleString('id-ID')}`
                : `Rp ${displayPrice.toLocaleString('id-ID')}`
              }
            </span>
          </div>

          {/* Location row */}
          {store?.address && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{store.address}</p>
          )}

          {/* CTA Button */}
          <div className="mt-auto pt-2" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
            {hasVariants ? (
              <button
                className="w-full text-white text-xs font-semibold py-2 rounded-md transition-all active:scale-95"
                style={{ backgroundColor: themeColor }}
              >
                Pilih Varian
              </button>
            ) : isOutOfStock ? (
              <button disabled className="w-full text-gray-400 bg-gray-100 text-xs font-semibold py-2 rounded-md cursor-not-allowed">
                Stok Habis
              </button>
            ) : (
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                price={displayPrice}
                image={product.images?.[0]}
                className="w-full text-white text-xs font-semibold py-2 rounded-md transition-all active:scale-95 shadow-sm"
                style={{ backgroundColor: themeColor }}
              >
                + Keranjang
              </AddToCartButton>
            )}
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
