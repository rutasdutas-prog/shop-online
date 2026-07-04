import { NextResponse } from 'next/server'

// Webhook untuk menerima pesan masuk dari WhatsApp Business API (Meta)
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Cek jika ini adalah pesan masuk dari customer
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            const message = change.value.messages[0]
            const senderPhone = message.from
            const text = message.text?.body

            // 1. Cari pelanggan berdasarkan nomor telepon
            // 2. Teruskan pesan 'text' ke API AI RAG (/api/ai)
            // 3. Kirim balasan AI kembali ke WhatsApp melalui WhatsApp Graph API
            console.log(`Pesan WA dari ${senderPhone}: ${text}`)
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// Endpoint untuk verifikasi webhook saat setup di Meta Developer Dashboard
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Ganti VERIFY_TOKEN dengan token rahasia Anda di Meta Dashboard
  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}
