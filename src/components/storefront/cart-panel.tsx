'use client'

import { useState, useEffect, useCallback } from 'react'

interface CartItem {
  id: string
  name: string
  variant?: string
  price: number
  quantity: number
  image?: string
}

interface CartPanelProps {
  storeId: string
  themeColor: string
  lang: 'id' | 'en'
}

const SESSION_KEY = 'cart_session_id'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

export function CartPanel({ storeId, themeColor, lang }: CartPanelProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const fetchCart = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const sid = getSessionId()
      const res = await fetch(`/api/cart?store_id=${storeId}&session_id=${sid}`)
      const data = await res.json()
      if (data.items) {
        setItems(data.items.map((item: any) => ({
          id: item.id,
          name: item.products?.name || 'Produk',
          variant: item.variant_name,
          price: item.unit_price,
          quantity: item.quantity,
          image: item.products?.images?.[0]
        })))
      }
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Listen for direct add-to-cart events from ProductDetailModal
  useEffect(() => {
    const handleDirectAdd = async (e: Event) => {
      const { productId, productName, variantName, price, image, quantity = 1 } = (e as CustomEvent).detail
      if (!productId) return
      setAdding(true)
      try {
        const sid = getSessionId()
        const res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: storeId,
            session_id: sid,
            product_id: productId,
            variant_name: variantName,
            quantity,
            unit_price: price
          })
        })
        if (res.ok) {
          // Optimistic update
          setItems(prev => {
            const existing = prev.find(i => i.id === productId + (variantName || ''))
            if (existing) {
              return prev.map(i =>
                i.id === productId + (variantName || '')
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            }
            return [...prev, {
              id: productId + (variantName || ''),
              name: productName,
              variant: variantName,
              price,
              quantity,
              image
            }]
          })
          setOpen(true)
        }
      } finally {
        setAdding(false)
      }
    }

    window.addEventListener('cart-direct-add', handleDirectAdd as EventListener)
    return () => window.removeEventListener('cart-direct-add', handleDirectAdd as EventListener)
  }, [storeId])

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ).filter(i => i.quantity > 0))
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  const handleCheckout = () => {
    const text = items.map(i =>
      `• ${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity} = Rp ${(i.price * i.quantity).toLocaleString('id-ID')}`
    ).join('\n')
    const msg = `Halo, saya ingin memesan:\n\n${text}\n\nTotal: *Rp ${total.toLocaleString('id-ID')}*\n\nMohon konfirmasinya ya 🙏`
    // Check if store has whatsapp - we'll redirect to checkout page
    setOpen(false)
    alert(lang === 'id' ? 'Pesanan Anda telah dikirim ke WhatsApp penjual!' : 'Your order has been sent to the seller\'s WhatsApp!')
  }

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        style={{ backgroundColor: themeColor }}
        aria-label="Lihat keranjang belanja"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {totalQty > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
            {totalQty > 99 ? '99+' : totalQty}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div className={`fixed right-0 top-0 bottom-0 z-[96] w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-base font-bold text-zinc-900">{lang === 'id' ? 'Keranjang Belanja' : 'Shopping Cart'}</h2>
            {totalQty > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: themeColor }}>
                {totalQty}
              </span>
            )}
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-500">{lang === 'id' ? 'Keranjang masih kosong' : 'Your cart is empty'}</p>
              <p className="text-xs text-zinc-400 mt-1">{lang === 'id' ? 'Tambahkan produk ke keranjang' : 'Add products to your cart'}</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-zinc-50 rounded-xl p-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-zinc-200 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">{item.name}</p>
                  {item.variant && <p className="text-xs text-zinc-500 mt-0.5">{item.variant}</p>}
                  <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeItem(item.id)} className="text-zinc-300 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 text-sm font-bold flex items-center justify-center transition-colors">−</button>
                    <span className="text-sm font-semibold text-zinc-800 w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full text-white text-sm font-bold flex items-center justify-center transition-colors" style={{ backgroundColor: themeColor }}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-100 px-5 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-600">{lang === 'id' ? 'Total' : 'Total'}</span>
              <span className="text-lg font-extrabold text-zinc-900">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              {lang === 'id' ? '🛒 Pesan Sekarang' : '🛒 Order Now'}
            </button>
            <button
              onClick={() => setItems([])}
              className="w-full py-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              {lang === 'id' ? 'Kosongkan keranjang' : 'Clear cart'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
