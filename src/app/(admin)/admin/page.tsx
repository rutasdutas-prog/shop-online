import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'SUPER_ADMIN') redirect('/dashboard')

  // Fetch platform stats
  const [
    { count: totalStores },
    { count: activeStores },
    { count: totalUsers },
    { count: totalOrders },
    { count: totalProducts },
  ] = await Promise.all([
    supabase.from('stores').select('*', { count: 'exact', head: true }),
    supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
  ])

  // Recent stores
  const { data: recentStores } = await supabase
    .from('stores')
    .select('id, name, slug, status, created_at, owner_id')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Toko', value: totalStores ?? 0, icon: '🏪', color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20', href: '/admin/stores' },
    { label: 'Toko Aktif', value: activeStores ?? 0, icon: '✅', color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20', href: '/admin/stores' },
    { label: 'Total Pengguna', value: totalUsers ?? 0, icon: '👤', color: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-500/20', href: '/admin/users' },
    { label: 'Total Produk', value: totalProducts ?? 0, icon: '📦', color: 'from-orange-500 to-amber-600', glow: 'shadow-orange-500/20', href: '/admin/stores' },
    { label: 'Total Order', value: totalOrders ?? 0, icon: '🛒', color: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/20', href: '/admin/stores' },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Pantau seluruh aktivitas platform TokoKita secara real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <div className={`relative bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl mb-4 shadow-lg ${stat.glow}`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</div>
              <div className="text-xs text-zinc-500 font-medium">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Stores */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Toko Terbaru</h2>
          <Link href="/admin/stores" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Lihat semua →</Link>
        </div>
        <div className="divide-y divide-white/5">
          {(recentStores || []).map((store) => (
            <div key={store.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-300">
                  {store.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{store.name}</div>
                  <div className="text-xs text-zinc-500">/{store.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  store.status === 'ACTIVE' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {store.status === 'ACTIVE' ? 'Aktif' : 'Suspend'}
                </span>
                <span className="text-xs text-zinc-600">{new Date(store.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          ))}
          {(!recentStores || recentStores.length === 0) && (
            <div className="px-6 py-12 text-center text-zinc-600 text-sm">Belum ada toko terdaftar.</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/stores', icon: '🏪', title: 'Kelola Toko', desc: 'Suspend atau aktifkan toko', color: 'group-hover:border-violet-500/30' },
          { href: '/admin/users', icon: '👤', title: 'Kelola Pengguna', desc: 'Lihat semua user platform', color: 'group-hover:border-blue-500/30' },
        ].map(action => (
          <Link key={action.href} href={action.href} className="group bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:bg-zinc-800/50 transition-all duration-300">
            <div className={`border border-transparent ${action.color} transition-colors`}></div>
            <div className="text-2xl mb-3">{action.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{action.title}</div>
            <div className="text-xs text-zinc-500">{action.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
