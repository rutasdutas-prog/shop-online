'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function SearchAutocomplete({ storeId, themeColor }: { storeId: string, themeColor: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ products: any[] }>({ products: [] })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query) {
      setResults({ products: [] })
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?storeId=${storeId}&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300) // debounce

    return () => clearTimeout(timer)
  }, [query, storeId])

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl z-50">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query && results.products.length > 0) setOpen(true)
          }}
          placeholder="Cari produk..."
          className="w-full bg-white/90 backdrop-blur border-0 rounded-full px-6 py-3.5 pr-12 text-zinc-900 shadow-xl focus:ring-2 focus:ring-white/50 outline-none transition-all placeholder:text-zinc-500 text-sm font-medium"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {open && results.products.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col">
          <div className="px-4 py-2 bg-zinc-50/50 border-b border-zinc-100">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">PRODUK</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {results.products.map(product => {
              const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
              const price = product.price || 0
              const discount = product.discount_price || 0
              const hasDiscount = discount > 0 && discount < price
              const displayPrice = hasDiscount ? discount : price
              
              // Highlighting matches
              const regex = new RegExp(`(${query})`, 'gi')
              const nameParts = product.name.split(regex)

              return (
                <div 
                  key={product.id}
                  onClick={() => {
                    // Smooth scroll to product if it's on the page, or handle navigation.
                    // For now, let's just close it.
                    setOpen(false)
                    setQuery('')
                    // You can add router.push to a product detail page if you have one.
                  }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 cursor-pointer transition-colors border-b border-zinc-100/50 last:border-0"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0 border border-zinc-200/60">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-800 font-medium truncate">
                      {nameParts.map((part: string, i: number) => 
                        part.toLowerCase() === query.toLowerCase() ? (
                          <span key={i} className="font-bold text-black">{part}</span>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {hasDiscount && (
                      <div className="text-[10px] text-zinc-400 line-through mb-0.5">
                        Rp {price.toLocaleString('id-ID')}
                      </div>
                    )}
                    <div className="text-sm font-bold text-zinc-900">
                      Rp {displayPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
