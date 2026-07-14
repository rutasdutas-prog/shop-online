import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/users-table'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Pengguna</h1>
        <p className="text-sm text-zinc-500 mt-1">{(users || []).length} pengguna terdaftar di platform</p>
      </div>
      <UsersTable users={users || []} currentUserId={user.id} />
    </div>
  )
}
