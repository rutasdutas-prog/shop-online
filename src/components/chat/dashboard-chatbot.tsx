'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { label: '📦 Potong stok offline', prompt: 'Potong stok [nama produk] sebanyak 1' },
  { label: '🔍 Cek stok produk', prompt: 'Cek stok [nama produk]' },
  { label: '✍️ Buat deskripsi produk', prompt: 'Bantu saya membuat deskripsi produk yang menarik untuk dijual online.' },
  { label: '💬 Template caption IG', prompt: 'Buatkan contoh caption Instagram yang menarik untuk promosi produk toko saya.' },
]

export function DashboardChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! 👋 Saya **Asisten Bisnis** TokoKita. Saya siap membantu Anda mengelola toko!\n\n**Yang bisa saya lakukan:**\n- 📦 **Potong stok** — Ketik: *"potong stok [nama/kode] [jumlah]"*\n- 🔍 **Cek stok** — Ketik: *"cek stok [nama/kode]"*\n- ✍️ Buat deskripsi produk & caption media sosial\n- 💡 Ide strategi pemasaran & diskon\n\nMau mulai dengan apa hari ini?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const sendMessage = async (text?: string) => {
    const userMessage = (text || input).trim()
    if (!userMessage || isLoading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          storeSlug: null // null = dashboard mode
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || data.error || 'Maaf, terjadi kesalahan.'
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, koneksi bermasalah. Coba lagi ya!' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Render markdown-like formatting (bold with **)
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="block leading-relaxed" />
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3.5 rounded-full shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <span className="text-sm font-semibold">Asisten AI</span>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[420px] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-zinc-200 overflow-hidden flex flex-col" style={{ maxHeight: '580px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm">Asisten Bisnis AI</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-white/80 text-xs">Siap membantu bisnis Anda</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50" style={{ minHeight: '300px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            )}
            <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                : 'bg-white text-zinc-700 rounded-bl-md border border-zinc-100 shadow-sm'
            }`}>
              {renderText(msg.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
            <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm text-xs text-zinc-400">
              Sedang berpikir...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 bg-zinc-50 grid grid-cols-2 gap-1.5">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q.label}
              onClick={() => sendMessage(q.prompt)}
              className="text-xs px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-left leading-snug"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-zinc-100 flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ketik pertanyaan atau permintaan Anda..."
          rows={1}
          className="flex-1 text-sm px-4 py-2.5 bg-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all resize-none"
          disabled={isLoading}
          style={{ maxHeight: '80px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md"
        >
          <svg className="w-4 h-4 rotate-45 -translate-x-px" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
