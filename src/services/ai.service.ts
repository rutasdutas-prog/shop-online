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

    // 4. Deteksi Provider
    const isOpenAI = apiKey.startsWith('sk-')
    const isGemini = apiKey.startsWith('AIza') || apiKey.startsWith('AQ')
    
    if (isGemini) {
      return this.executeGeminiNative(apiKey, systemPrompt, history, newMessage, tools)
    }

    // --- Format OpenAI / Groq ---
    let apiUrl = 'https://api.groq.com/openai/v1/chat/completions'
    let model = 'llama-3.3-70b-versatile'
    if (isOpenAI) {
      apiUrl = 'https://api.openai.com/v1/chat/completions'
      model = 'gpt-4o-mini'
    }

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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(bodyPayload)
    })

    if (!response.ok) {
      const errText = await response.text()
      let errMsg = 'Unknown'
      try {
        const errData = JSON.parse(errText)
        errMsg = errData.error?.message || errData.message || errText
      } catch (e) { errMsg = errText }
      throw new Error(`Error AI: ${errMsg}`)
    }

    const data = await response.json()
    return { data, apiUrl, model, aiMessages, isGemini: false }
  }

  /**
   * Eksekusi native Gemini API untuk menghindari bug OpenAI compatibility layer
   */
  async executeGeminiNative(apiKey: string, systemPrompt: string, history: any[], newMessage: string, tools: any[] | null) {
    const geminiModel = 'gemini-2.0-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
    
    let contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
    contents.push({ role: 'user', parts: [{ text: newMessage }] })

    const payload: any = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    }

    if (tools && tools.length > 0) {
      payload.tools = [{
        functionDeclarations: tools.map(t => ({
          name: t.function.name,
          description: t.function.description,
          parameters: {
            type: 'OBJECT',
            properties: t.function.parameters?.properties || {},
            required: t.function.parameters?.required || []
          }
        }))
      }]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Error Gemini: ${errText}`)
    }

    const gRes = await response.json()
    const part = gRes.candidates?.[0]?.content?.parts?.[0]
    let choice: any = { message: { role: 'assistant', content: null } }

    if (part?.functionCall) {
      choice.finish_reason = 'tool_calls'
      choice.message.tool_calls = [{
        id: part.functionCall.name,
        type: 'function',
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args)
        }
      }]
    } else if (part?.text) {
      choice.finish_reason = 'stop'
      choice.message.content = part.text
    }

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: newMessage }
    ]

    return { data: { choices: [choice] }, apiUrl, model: geminiModel, aiMessages, isGemini: true }
  }

  /**
   * Untuk request follow-up (setelah eksekusi tool)
   */
  async getFollowUpCompletion(apiUrl: string, apiKey: string, payload: any, isGemini: boolean = false) {
    if (isGemini) {
      return this.executeGeminiFollowUp(apiUrl, apiKey, payload)
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
       const errText = await response.text()
       throw new Error(`Follow-up request failed: ${errText}`)
    }
    return response.json()
  }

  async executeGeminiFollowUp(apiUrl: string, apiKey: string, payload: any) {
    let contents: any[] = []
    
    for (const m of payload.messages) {
      if (m.role === 'system') continue
      if (m.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: m.content }] })
      } else if (m.role === 'assistant' && m.tool_calls) {
        contents.push({
          role: 'model',
          parts: m.tool_calls.map((tc: any) => ({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments)
            }
          }))
        })
      } else if (m.role === 'tool') {
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: m.tool_call_id,
              response: { result: m.content }
            }
          }]
        })
      }
    }

    const geminiPayload = { contents }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Follow-up Gemini failed: ${errText}`)
    }

    const gRes = await response.json()
    const part = gRes.candidates?.[0]?.content?.parts?.[0]
    let choice: any = { message: { role: 'assistant', content: null } }

    if (part?.text) {
      choice.finish_reason = 'stop'
      choice.message.content = part.text
    }

    return { choices: [choice] }
  }

  /**
   * Menyimpan balasan AI
   */
  async saveAssistantReply(sessionId: string, replyText: string) {
    await chatRepository.saveMessage(sessionId, 'assistant', replyText)
  }
}

export const aiService = new AIService()
