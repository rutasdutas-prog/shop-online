import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireStore } from '@/lib/dal'

export const dynamic = 'force-dynamic'

async function createVoucher(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { user, store } = await requireStore()
  if (!user) return

    if (!store) return

  const code = (formData.get('code') as string).toUpperCase().trim()
  const type = formData.get('type') as string
  const value = parseFloat(formData.get('value') as string)
  const description = formData.get('description') as string
  const minPurchase = parseFloat(formData.get('min_purchase') as string) || 0
  const maxDiscount = parseFloat(formData.get('max_discount') as string) || null
  const maxUses = parseInt(formData.get('max_uses') as string) || null
  const expiresAt = formData.get('expires_at') as string || null

  await supabase.from('vouchers').insert({
    store_id: store.id, code, type, value, description, min_purchase: minPurchase,
    max_discount: maxDiscount, max_uses: maxUses,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    is_active: true
  })
  revalidatePath('/dashboard/vouchers')
}

async function toggleVoucher(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const current = formData.get('current') === 'true'
  await supabase.from('vouchers').update({ is_active: !current }).eq('id', id)
  revalidatePath('/dashboard/vouchers')
}

async function deleteVoucher(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  await supabase.from('vouchers').delete().eq('id', id)
  revalidatePath('/dashboard/vouchers')
}

export default async function VouchersPage() {
  const supabase = await createClient()
  const { user, store } = await requireStore()

    const { data: vouchers } = store
    ? await supabase.from('vouchers').select('*').eq('store_id', store.id).order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Voucher & Promo</h1>
        <span className="text-sm text-zinc-500">{vouchers?.length || 0} voucher</span>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">Buat Voucher Baru</h2>
        <form action={createVoucher} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Kode Voucher *</label>
            <input name="code" required placeholder="DISKON10" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300 uppercase" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tipe Diskon *</label>
            <select name="type" required className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300">
              <option value="PERCENT">Persentase (%)</option>
              <option value="FIX">Nominal Tetap (Rp)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Nilai Diskon *</label>
            <input name="value" type="number" required placeholder="10 (untuk 10%)" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Min. Pembelian (Rp)</label>
            <input name="min_purchase" type="number" placeholder="0" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Maks. Diskon (Rp, untuk %)</label>
            <input name="max_discount" type="number" placeholder="Kosongkan jika tidak ada batas" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Batas Pemakaian</label>
            <input name="max_uses" type="number" placeholder="Kosongkan = tidak terbatas" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Berlaku Hingga</label>
            <input name="expires_at" type="date" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Deskripsi</label>
            <input name="description" placeholder="Deskripsi voucher (opsional)" className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div className="col-span-2">
            <button type="submit" className="bg-zinc-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors">
              + Buat Voucher
            </button>
          </div>
        </form>
      </div>

      {/* Voucher List */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        {!vouchers?.length ? (
          <div className="py-16 text-center text-zinc-400">
            <div className="text-4xl mb-3">🎫</div>
            <p className="text-sm">Belum ada voucher. Buat yang pertama!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Diskon</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Min. Belanja</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Pemakaian</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {vouchers?.map((v: any) => (
                <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-zinc-800">{v.code}</span>
                    {v.description && <div className="text-xs text-zinc-400">{v.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {v.type === 'PERCENT' ? `${v.value}%` : `Rp ${Number(v.value).toLocaleString('id-ID')}`}
                    {v.max_discount && <div className="text-xs text-zinc-400">maks. Rp {Number(v.max_discount).toLocaleString('id-ID')}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {v.min_purchase > 0 ? `Rp ${Number(v.min_purchase).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {v.used_count || 0}{v.max_uses ? `/${v.max_uses}` : ''} kali
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {v.is_active ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form action={toggleVoucher}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="current" value={String(v.is_active)} />
                        <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-2 py-1 rounded-lg transition-colors">
                          {v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </form>
                      <form action={deleteVoucher}>
                        <input type="hidden" name="id" value={v.id} />
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 border border-red-100 px-2 py-1 rounded-lg transition-colors">
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
