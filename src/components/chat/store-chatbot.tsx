'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CartItem {
  name: string
  qty: number
  price: number
}

interface StoreChatbotProps {
  storeSlug: string
  storeName: string
  themeColor: string
  lang: string
}

// Generate/get session ID for anonymous cart
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('cart_session')
  if (!sid) {
    sid = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2)
    sessionStorage.setItem('cart_session', sid)
  }
  return sid
}

const QUICK_REPLIES_ID = ['Produk terlaris?', 'Ada diskon?', 'Saya mau beli', 'Lihat keranjang']
const QUICK_REPLIES_EN = ['Best sellers?', 'Any discounts?', 'I want to buy', 'View cart']

export function StoreChatbot({ storeSlug, storeName, themeColor, lang }: StoreChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: lang === 'id'
        ? `Halo! 👋 Selamat datang di **${storeName}**!\n\nSaya AI Shopping Assistant Anda. Saya bisa:\n- 🔍 Membantu menemukan produk\n- 🛒 Langsung menambahkan ke keranjang\n- 🎁 Mengecek & menerapkan voucher\n- ✅ Membuat pesanan untuk Anda\n\nMau mulai belanja? Tanya saja!`
        : `Hello! 👋 Welcome to **${storeName}**!\n\nI'm your AI Shopping Assistant. Ask me anything!`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [showCart, setShowCart] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleCartAdd = (e: any) => {
      const productName = e.detail?.productName
      if (productName) {
        setIsOpen(true)
        setHasUnread(false)
        sendMessage(`Saya mau beli 1 ${productName}`)
      }
    }
    window.addEventListener('ai-cart-add', handleCartAdd)
    return () => window.removeEventListener('ai-cart-add', handleCartAdd)
  }, [messages, isLoading])

  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
  }

  const sendMessage = async (msg?: string) => {
    const userMessage = (msg || input).trim()
    if (!userMessage || isLoading) return
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const sessionId = getSessionId()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, storeSlug, sessionId })
      })
      const data = await res.json()
      const reply = data.message || data.error || 'Maaf, terjadi kesalahan.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])

      // Jika ada aksi cart, update indikator
      if (data.toolName?.includes('keranjang') || data.toolName === 'buat_draft_order') {
        // Hitung dari pesan berhasil tambah
        if (data.toolName === 'tambah_ke_keranjang') {
          setCartCount(c => c + 1)
        } else if (data.toolName === 'hapus_dari_keranjang') {
          setCartCount(c => Math.max(0, c - 1))
        } else if (data.toolName === 'buat_draft_order') {
          setCartCount(0)
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, koneksi bermasalah. Coba lagi ya!' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Render markdown-like bold text
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[390px] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-zinc-200 overflow-hidden flex flex-col"
          style={{ maxHeight: '580px' }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ backgroundColor: themeColor }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{storeName}</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white/80 text-xs">AI Shopping Assistant</span>
              </div>
            </div>
            {/* Cart indicator */}
            {cartCount > 0 && (
              <button
                onClick={() => sendMessage('lihat keranjang')}
                className="relative bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1 flex items-center gap-1.5 text-white text-xs font-semibold"
              >
                🛒 {cartCount}
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1 mr-2"
                    style={{ backgroundColor: themeColor }}>AI</div>
                )}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-md'
                    : 'bg-white text-zinc-700 rounded-bl-md border border-zinc-100 shadow-sm'
                }`}
                  style={msg.role === 'user' ? { backgroundColor: themeColor } : {}}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: themeColor }}>AI</div>
                <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap bg-zinc-50 shrink-0">
              {(lang === 'id' ? QUICK_REPLIES_ID : QUICK_REPLIES_EN).map(q => (
                <button key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-zinc-600 hover:border-zinc-400 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-zinc-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={lang === 'id' ? 'Ketik pesan atau perintah belanja...' : 'Type a message...'}
              className="flex-1 text-sm px-4 py-2.5 bg-zinc-100 rounded-full outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': themeColor + '40' } as any}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 shrink-0"
              style={{ backgroundColor: themeColor }}
            >
              <svg className="w-4 h-4 rotate-45 -translate-x-px" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={handleOpen}
        className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative"
        style={{ backgroundColor: themeColor, boxShadow: `0 8px 30px -4px ${themeColor}60` }}
        aria-label="Chat dengan asisten toko"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">1</span>
        )}
        {cartCount > 0 && !isOpen && (
          <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  )
}
