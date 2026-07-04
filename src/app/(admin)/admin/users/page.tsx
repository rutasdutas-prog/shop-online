import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    OWNER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    STAFF: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    CUSTOMER: 'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Pengguna</h1>
        <p className="text-sm text-zinc-500 mt-1">{(users || []).length} pengguna terdaftar di platform</p>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pengguna</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tgl Daftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(users || []).map((u) => (
                <tr key={u.id} className={`hover:bg-white/5 transition-colors ${u.id === user.id ? 'bg-violet-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {u.full_name || '-'}
                          {u.id === user.id && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">Anda</span>}
                        </div>
                        <div className="text-xs text-zinc-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${roleColors[u.role] || roleColors.CUSTOMER}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-500">{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
