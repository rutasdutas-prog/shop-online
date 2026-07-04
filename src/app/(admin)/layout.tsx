import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/actions/auth.actions'

export const dynamic = 'force-dynamic'

const adminNavItems = [
  { href: '/admin', label: 'Overview Platform', icon: '⊞', exact: true },
  { href: '/admin/stores', label: 'Manajemen Toko', icon: '🏪' },
  { href: '/admin/users', label: 'Manajemen Pengguna', icon: '👤' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white text-xs font-bold">SA</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider">SUPER ADMIN</div>
              <div className="text-[10px] text-zinc-500">TokoKita Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-all group"
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          <div className="pt-4 border-t border-white/5 mt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
            >
              <span>↗</span>
              <span>Ke Dashboard Toko</span>
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs text-white font-bold">{user.email?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-400 truncate">{user.email}</div>
              <div className="text-[10px] text-violet-400 font-medium">Super Admin</div>
            </div>
          </div>
          <form action={signout}>
            <button type="submit" className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <span>→</span>
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-zinc-950">
        <header className="h-14 border-b border-white/5 flex items-center px-6 sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-violet-300 font-medium">Admin Mode</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
