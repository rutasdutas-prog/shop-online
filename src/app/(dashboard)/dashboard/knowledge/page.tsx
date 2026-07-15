import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import KnowledgeForm from './knowledge-form'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { user, store } = await requireStore()

    const { data: knowledge } = store
    ? await supabase.from('knowledge_base').select('id, title, content, created_at').eq('store_id', store.id).order('created_at', { ascending: false })
    : { data: [] }

  const apiKey = process.env.GEMINI_API_KEY || ''
  const isGroq = Boolean(apiKey && !(apiKey.startsWith('sk-') || apiKey.startsWith('AIza') || apiKey.startsWith('AQ')))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">AI Knowledge Base (RAG)</h1>
          <p className="text-sm text-zinc-500 mt-1">Ajari AI informasi spesifik tentang toko Anda (FAQ, aturan toko, panduan ukuran, dll).</p>
        </div>
        <span className="text-sm text-zinc-500">{knowledge?.length || 0} dokumen</span>
      </div>

      {isGroq && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3 text-sm text-yellow-800">
          <div className="text-xl">⚠️</div>
          <div>
            <strong>Perhatian:</strong> Fitur Knowledge Base memerlukan pembuatan Embeddings. Karena Anda saat ini menggunakan API Key Groq, fitur ini tidak akan berfungsi. Silakan ganti ke API Key OpenAI (<code className="bg-yellow-100 px-1 rounded">sk-...</code>) atau Gemini (<code className="bg-yellow-100 px-1 rounded">AQ.</code>) di konfigurasi jika ingin menggunakan RAG.
          </div>
        </div>
      )}

      {/* Form */}
      <KnowledgeForm disabled={isGroq} />

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {knowledge?.map((item: any) => (
          <div key={item.id} className="bg-white rounded-xl border border-zinc-100 p-5 relative group">
            <h3 className="font-semibold text-zinc-900 mb-2 pr-8">{item.title}</h3>
            <p className="text-sm text-zinc-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">{item.content}</p>
            <div className="text-xs text-zinc-400 mt-4">
              Ditambahkan: {new Date(item.created_at).toLocaleDateString('id-ID')}
            </div>
            
            <form action={async () => {
              'use server'
              const supabaseSrv = await createClient()
              await supabaseSrv.from('knowledge_base').delete().eq('id', item.id)
              revalidatePath('/dashboard/knowledge')
            }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus Dokumen">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </form>
          </div>
        ))}

        {!knowledge?.length && (
          <div className="col-span-full py-16 text-center text-zinc-400 bg-white rounded-xl border border-zinc-100">
            <div className="text-4xl mb-3">🧠</div>
            <p className="text-sm">Belum ada dokumen. Ajari AI Anda sekarang!</p>
          </div>
        )}
      </div>
    </div>
  )
}
