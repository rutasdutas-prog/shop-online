import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/actions/auth.actions'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { DashboardChatbot } from '@/components/chat/dashboard-chatbot'
import { AutoRefresh } from '@/components/dashboard/auto-refresh'
import { requireUser } from '@/lib/dal'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {

  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { user, store } = await requireUser()

  
  const lang = await getLanguage()
  const dict = dictionaries[lang]

  const navItems = [
    { href: '/dashboard', label: dict.dashboard.menuOverview, icon: '⊞' },
    { href: '/dashboard/categories', label: 'Kategori', icon: '📁' },
    { href: '/dashboard/products', label: dict.dashboard.menuProducts, icon: '📦' },
    { href: '/dashboard/orders', label: dict.dashboard.menuOrders, icon: '🛒' },
    { href: '/dashboard/inventory', label: dict.dashboard.menuInventory, icon: '📋' },
    { href: '/dashboard/vouchers', label: 'Voucher', icon: '🎫' },
    { href: '/dashboard/customers', label: dict.dashboard.menuCustomers, icon: '👥' },
    { href: '/dashboard/reports', label: dict.dashboard.menuReports, icon: '📊' },
    { href: '/dashboard/knowledge', label: 'Knowledge Base (RAG)', icon: '🧠' },
    { href: '/dashboard/appearance', label: dict.dashboard.menuAppearance, icon: '🎨' },
    { href: '/dashboard/settings', label: dict.dashboard.menuSettings, icon: '⚙️' },
  ]

  return (
    <>
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zinc-100 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">TK</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {store?.name || 'TokoKita'}
              </div>
              {store && (
                <div className="text-xs text-zinc-400 truncate">/{store.slug}</div>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {store && navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors group"
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom: User + signout */}
        <div className="px-3 py-4 border-t border-zinc-100 space-y-1">
          {store && (
            <Link
              href={`/${store.slug}`}
              target="_blank"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
            >
              <span>🔗</span>
              <span>{lang === 'id' ? 'Lihat Toko Publik' : 'View Public Store'}</span>
            </Link>
          )}

          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-zinc-600">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-600 truncate">{user.email}</p>
            </div>
          </div>

          <form action={signout}>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors text-left mt-1">
              <span>←</span>
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-zinc-100 flex items-center px-6 sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {store && (
              <Link
                href={`/${store.slug}`}
                target="_blank"
                className="text-xs text-zinc-500 hover:text-zinc-800 px-3 py-1.5 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
              >
                {lang === 'id' ? '↗ Buka Toko' : '↗ Open Store'}
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
    <AutoRefresh interval={15000} />
    <DashboardChatbot />
    </>
  )
}
