import { chatRepository } from '../repositories/chat.repository'

export class AIService {
  /**
   * Mengirim request ke AI Provider (Groq/Gemini/OpenRouter/DeepSeek)
   * Menggunakan format OpenAI-compatible API.
   */
  async getChatCompletion(
    sessionId: string,
    systemPrompt: string,
    newMessage: string,
    apiKey: string,
    tools: any[] | null = null
  ) {
    // 1. Simpan pesan user baru ke DB
    await chatRepository.saveMessage(sessionId, 'user', newMessage)

    // 2. Ambil riwayat percakapan (20 pesan terakhir)
    const history = await chatRepository.getHistory(sessionId, 20)

    // 3. Susun array "messages"
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...history
    ]

    // 4. Deteksi Provider & Set URL
    const isOpenAI = apiKey.startsWith('sk-')
    const isGemini = apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')
    
    let apiUrl = 'https://api.groq.com/openai/v1/chat/completions'
    let model = 'llama-3.1-8b-instant'
    
    if (isOpenAI) {
      apiUrl = 'https://api.openai.com/v1/chat/completions'
      model = 'gpt-4o-mini'
    } else if (isGemini) {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${apiKey}`
      model = 'gemini-1.5-flash'
    }

    // 5. Susun Payload
    const bodyPayload: any = {
      model,
      messages: aiMessages,
      temperature: 0.7,
      max_tokens: 1024
    }

    if (tools && tools.length > 0) {
      bodyPayload.tools = tools
      bodyPayload.tool_choice = 'auto'
    }

    // 6. Request ke Provider AI
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(bodyPayload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('API Error:', errText)
      let errMsg = 'Unknown'
      try {
        const errData = JSON.parse(errText)
        errMsg = errData.error?.message || errData.message || errText
      } catch (e) {
        errMsg = errText
      }
      throw new Error(`Error AI: ${errMsg}`)
    }

    const data = await response.json()
    return { data, apiUrl, model, aiMessages }
  }

  /**
   * Untuk request follow-up (setelah eksekusi tool)
   */
  async getFollowUpCompletion(apiUrl: string, apiKey: string, payload: any) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
       const errText = await response.text()
       throw new Error(`Follow-up request failed: ${errText}`)
    }
    return response.json()
  }

  /**
   * Menyimpan balasan AI
   */
  async saveAssistantReply(sessionId: string, replyText: string) {
    await chatRepository.saveMessage(sessionId, 'assistant', replyText)
  }
}

export const aiService = new AIService()
