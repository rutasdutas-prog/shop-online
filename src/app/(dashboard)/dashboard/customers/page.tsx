import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single()
  if (!store) redirect('/dashboard/setup')

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const allCustomers = customers || []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Pelanggan</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Data pelanggan yang pernah berbelanja di toko Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="text-xs text-zinc-400 mb-1">Total Pelanggan</div>
          <div className="text-xl font-semibold text-zinc-900">{allCustomers.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="text-xs text-zinc-400 mb-1">Baru Bulan Ini</div>
          <div className="text-xl font-semibold text-zinc-900">
            {allCustomers.filter(c => {
              const d = new Date(c.created_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        {allCustomers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">👥</div>
            <p className="text-sm font-medium text-zinc-600">Belum ada pelanggan</p>
            <p className="text-xs text-zinc-400 mt-1">Data pelanggan akan muncul setelah ada order masuk</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Telepon</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {allCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                        <span className="text-xs text-zinc-600 font-medium">{customer.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-zinc-800">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{customer.phone || '—'}</td>
                  <td className="px-5 py-3 text-zinc-500">{customer.email || '—'}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(customer.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
