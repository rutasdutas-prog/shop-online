import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { user, store } = await requireStore()

  
  const lang = await getLanguage()
  const dict = dictionaries[lang]

  // Fetch stats
  const [
    { count: productCount },
    { count: orderCount },
    { count: customerCount },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
  ])

  // Calculate revenue from PAID orders
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('store_id', store.id)
    .in('status', ['PAID', 'COMPLETED'])

  const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0)

  const stats = [
    {
      label: dict.dashboard.overviewTotalProducts,
      value: productCount ?? 0,
      icon: '📦',
      href: '/dashboard/products',
      color: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      trend: lang === 'id' ? 'Produk aktif' : 'Active products',
    },
    {
      label: dict.dashboard.overviewTotalOrders,
      value: orderCount ?? 0,
      icon: '🛒',
      href: '/dashboard/orders',
      color: 'bg-violet-50',
      iconBg: 'bg-violet-100',
      trend: lang === 'id' ? 'Total transaksi' : 'Total transactions',
    },
    {
      label: dict.dashboard.overviewRevenue,
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      icon: '💰',
      href: '/dashboard/reports',
      color: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      trend: lang === 'id' ? 'Total pendapatan' : 'Total revenue',
    },
    {
      label: dict.dashboard.overviewCustomers,
      value: customerCount ?? 0,
      icon: '👥',
      href: '/dashboard/customers',
      color: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      trend: lang === 'id' ? 'Pelanggan terdaftar' : 'Registered customers',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{dict.dashboard.overviewTitle}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {dict.dashboard.overviewWelcome} <span className="font-semibold text-zinc-700">{user.email?.split('@')[0]}</span> 👋
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-700">{lang === 'id' ? 'Toko Aktif' : 'Store Active'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl border border-zinc-100 p-5 hover:border-zinc-200 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-zinc-900 mb-0.5 group-hover:text-zinc-700 transition-colors">{stat.value}</div>
            <div className="text-xs font-semibold text-zinc-700">{stat.label}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{stat.trend}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{dict.dashboard.quickActions}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/dashboard/products/new" className="flex items-center gap-3 bg-white border border-zinc-100 rounded-xl p-4 hover:border-zinc-200 hover:shadow-sm transition-all group">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white text-sm font-bold group-hover:bg-zinc-700 transition-colors">+</div>
            <div>
              <div className="text-sm font-semibold text-zinc-800">{dict.dashboard.qaAddProduct}</div>
              <div className="text-xs text-zinc-400">{dict.dashboard.qaAddProductDesc}</div>
            </div>
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 bg-white border border-zinc-100 rounded-xl p-4 hover:border-zinc-200 hover:shadow-sm transition-all group">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-base">📋</div>
            <div>
              <div className="text-sm font-semibold text-zinc-800">{dict.dashboard.qaManageOrders}</div>
              <div className="text-xs text-zinc-400">{dict.dashboard.qaManageOrdersDesc}</div>
            </div>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 bg-white border border-zinc-100 rounded-xl p-4 hover:border-zinc-200 hover:shadow-sm transition-all group">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-base">⚙️</div>
            <div>
              <div className="text-sm font-semibold text-zinc-800">{dict.dashboard.qaSettings}</div>
              <div className="text-xs text-zinc-400">{dict.dashboard.qaSettingsDesc}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-zinc-900">{dict.dashboard.storeInfo}</h2>
          <Link href="/dashboard/settings" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors border border-zinc-200 rounded-lg px-3 py-1 hover:border-zinc-300">
            {lang === 'id' ? 'Edit →' : 'Edit →'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div>
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{dict.dashboard.storeName}</div>
            <div className="font-semibold text-zinc-900">{store.name}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{dict.dashboard.publicUrl}</div>
            <a href={`/${store.slug}`} target="_blank" className="font-semibold text-zinc-900 hover:text-violet-600 transition-colors">
              /{store.slug} ↗
            </a>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{dict.dashboard.status}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="font-semibold text-emerald-700">{dict.dashboard.statusActive}</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{dict.dashboard.plan}</div>
            <div className="font-semibold text-zinc-900">Free</div>
          </div>
        </div>
      </div>
    </div>
  )
}
