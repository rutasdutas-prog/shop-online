import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Login berhasil, arahkan ke dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Jika gagal atau tidak ada kode, kembali ke login dengan error
  return NextResponse.redirect(new URL('/login?error=Tidak%20dapat%20login%20dengan%20Google', request.url))
}
