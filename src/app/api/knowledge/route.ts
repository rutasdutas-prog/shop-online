import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY // User's API key
    
    if (!apiKey || (!apiKey.startsWith('sk-') && !apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.'))) {
      return NextResponse.json({ 
        error: 'API Key tidak valid. Masukkan kunci OpenAI (sk-...) atau Gemini (AIza... / AQ...).' 
      }, { status: 400 })
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    let embedding: number[] = []

    if (apiKey.startsWith('sk-')) {
      // OpenAI
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          input: content,
          model: 'text-embedding-3-small'
        })
      })

      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.error?.message || 'Gagal membuat embedding' }, { status: 500 })
      }

      const data = await res.json()
      embedding = data.data[0].embedding
    } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
      // Gemini
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: content }]
          }
        })
      })

      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.error?.message || 'Gagal membuat embedding Gemini' }, { status: 500 })
      }

      const data = await res.json()
      embedding = data.embedding.values
      // Pad to 1536 to match DB schema (cosine similarity remains valid)
      if (embedding.length < 1536) {
        const padding = new Array(1536 - embedding.length).fill(0)
        embedding = [...embedding, ...padding]
      }
    } else {
      return NextResponse.json({ error: 'Format API Key tidak dikenali.' }, { status: 400 })
    }

    // Simpan ke DB
    const { error: dbError } = await supabase.from('knowledge_base').insert({
      store_id: store.id,
      title,
      content,
      embedding
    })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    await supabase.from('knowledge_base').delete().eq('id', id).eq('store_id', store.id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
