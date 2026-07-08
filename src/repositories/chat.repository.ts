import { createClient } from '@/lib/supabase/server'

export class ChatRepository {
  /**
   * Mendapatkan atau membuat session ID berdasarkan token
   */
  async getOrCreateSession(storeId: string, sessionToken: string): Promise<string> {
    const supabase = await createClient()

    // Cek apakah session sudah ada
    const { data: existingSession } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('store_id', storeId)
      .eq('session_token', sessionToken)
      .single()

    if (existingSession) {
      return existingSession.id
    }

    // Buat session baru
    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert({
        store_id: storeId,
        session_token: sessionToken
      })
      .select('id')
      .single()

    if (error || !newSession) {
      throw new Error(`Gagal membuat chat session: ${error?.message}`)
    }

    return newSession.id
  }

  /**
   * Mengambil riwayat percakapan (maksimal limit pesan terakhir)
   */
  async getHistory(sessionId: string, limit: number = 20) {
    const supabase = await createClient()
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching chat history:', error)
      return []
    }

    // Supabase order by desc, jadi kita reverse agar urut kronologis (lama ke baru)
    return (messages || []).reverse()
  }

  /**
   * Menyimpan pesan ke database
   */
  async saveMessage(sessionId: string, role: 'system' | 'user' | 'assistant', content: string) {
    const supabase = await createClient()
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content
      })

    if (error) {
      console.error('Error saving chat message:', error)
    }
  }
}

export const chatRepository = new ChatRepository()
