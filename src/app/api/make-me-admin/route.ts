import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Update role in our users table
  const { error } = await supabase
    .from('users')
    .update({ role: 'SUPER_ADMIN' })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Redirect to the newly unlocked admin panel
  return NextResponse.redirect(new URL('/admin', request.url))
}
