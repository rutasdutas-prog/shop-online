'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KnowledgeForm({ disabled }: { disabled?: boolean }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan dokumen')
      }

      setTitle('')
      setContent('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5">
      <h2 className="text-sm font-semibold text-zinc-800 mb-4">Tambah Pengetahuan AI</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Judul Topik</label>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Contoh: Kebijakan Pengembalian Barang (Return)"
            className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300 disabled:bg-zinc-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">Isi Informasi (Detail)</label>
          <textarea
            required
            disabled={disabled || loading}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Tulis informasi detail yang harus diketahui AI. Contoh: Pelanggan bisa mengembalikan barang dalam waktu 3x24 jam jika cacat produksi, dengan syarat tag masih utuh..."
            rows={4}
            className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300 resize-y disabled:bg-zinc-50"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled || loading || !title || !content}
            className="bg-zinc-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : '+ Simpan & Latih AI'}
          </button>
        </div>
      </form>
    </div>
  )
}
