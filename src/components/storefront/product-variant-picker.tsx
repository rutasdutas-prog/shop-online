'use client'

import { useState } from 'react'

interface Variant {
  name: string
  price: number
  stock: number
  imageUrl: string
}

interface ProductVariantPickerProps {
  variants: Variant[]
  productName: string
  themeColor: string
  lang: string
}

export function ProductVariantPicker({ variants, productName, themeColor, lang }: ProductVariantPickerProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const selectedVariant = selected !== null ? variants[selected] : null

  const handleAddToCart = () => {
    if (selected === null) {
      alert(lang === 'id' ? 'Pilih varian terlebih dahulu!' : 'Please select a variant first!')
      return
    }
    const variantName = variants[selected].name
    window.dispatchEvent(new CustomEvent('ai-cart-add', {
      detail: { productName: `${productName} - ${variantName}` }
    }))
  }

  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false

  return (
    <div className="space-y-4">
      {/* Selected Variant Price */}
      {selectedVariant && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold" style={{ color: themeColor }}>
            Rp {selectedVariant.price.toLocaleString('id-ID')}
          </span>
          {selectedVariant.stock > 0 && (
            <span className="text-xs text-zinc-400 ml-2">Stok: {selectedVariant.stock}</span>
          )}
        </div>
      )}

      {/* Variant Grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          {lang === 'id' ? 'Pilih Varian' : 'Select Variant'}
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((v, idx) => {
            const outOfStock = v.stock <= 0
            const isSelected = selected === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => !outOfStock && setSelected(idx)}
                disabled={outOfStock}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg scale-[1.03]'
                    : outOfStock
                    ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                }`}
              >
                {v.imageUrl && (
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
              </button>
            )
          })}
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          isOutOfStock
            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            : selected === null
            ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-2 border-dashed border-zinc-300'
            : 'bg-zinc-900 text-white hover:bg-zinc-700 shadow-lg'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {selected === null
          ? (lang === 'id' ? 'Pilih Varian Dulu' : 'Select a Variant')
          : isOutOfStock
          ? (lang === 'id' ? 'Stok Habis' : 'Out of Stock')
          : (lang === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart')}
      </button>
    </div>
  )
}
