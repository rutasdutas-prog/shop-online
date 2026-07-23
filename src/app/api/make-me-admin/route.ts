import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Daftar email yang diizinkan menjadi Super Admin
// Tambahkan email Anda di sini DAN di environment variable ADMIN_EMAIL
const ALLOWED_ADMIN_EMAILS = [
  'drohendro2005@gmail.com',
]

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Gabungkan email dari hardcode + environment variable
  const envEmails = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  const allowedEmails = [
    ...ALLOWED_ADMIN_EMAILS.map(e => e.toLowerCase()),
    ...envEmails,
  ]

  // Jika tidak ada email yang dikonfigurasi, tolak semua
  if (allowedEmails.length === 0) {
    return NextResponse.json(
      { error: 'Tidak ada email admin yang dikonfigurasi. Tambahkan ADMIN_EMAIL di .env.local atau hardcode di route.ts' },
      { status: 403 }
    )
  }

  // Cek apakah email user ada di daftar yang diizinkan
  const userEmail = (user.email || '').toLowerCase()
  if (!allowedEmails.includes(userEmail)) {
    return NextResponse.json(
      { error: 'Akses ditolak. Email Anda tidak terdaftar sebagai admin.' },
      { status: 403 }
    )
  }

  // Update role di tabel users
  const { error } = await supabase
    .from('users')
    .update({ role: 'SUPER_ADMIN' })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Redirect ke admin panel
  return NextResponse.redirect(new URL('/admin', request.url))
}
