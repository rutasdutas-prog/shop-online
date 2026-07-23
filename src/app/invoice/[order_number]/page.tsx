import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Use service role to bypass RLS for public invoice access
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, {
    auth: { persistSession: false }
  })
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Menunggu Pembayaran', color: '#b45309', bg: '#fef3c7' },
  PAID:       { label: 'Sudah Dibayar',       color: '#065f46', bg: '#d1fae5' },
  PROCESSING: { label: 'Sedang Diproses',     color: '#1d4ed8', bg: '#dbeafe' },
  COMPLETED:  { label: 'Selesai',             color: '#047857', bg: '#d1fae5' },
  CANCELLED:  { label: 'Dibatalkan',          color: '#991b1b', bg: '#fee2e2' },
  REFUNDED:   { label: 'Refund',              color: '#6b21a8', bg: '#f3e8ff' },
}

export default async function InvoicePage(props: { params: Promise<{ order_number: string }> }) {
  const { order_number } = await props.params
  const adminDb = getAdminClient()

  const { data: order, error } = await adminDb
    .from('orders')
    .select(`
      *,
      store:stores(name, logo_url, whatsapp, address),
      customer:customers(name, phone, email, address),
      order_items(id, quantity, unit_price, subtotal, product:products(id, name, images, sku))
    `)
    .eq('order_number', order_number)
    .single()

  if (error) {
    console.error('[InvoicePage] Fetch error:', error)
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">Invoice Tidak Ditemukan</h1>
          <p className="text-gray-400 text-sm mb-1">Nomor pesanan: <span className="font-mono font-bold">{order_number}</span></p>
          {error && <p className="text-red-400 text-xs mt-2">Error: {error.message}</p>}
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: '#374151', bg: '#f3f4f6' }
  const store = order.store as any
  const customer = order.customer as any
  const items = order.order_items || []
  const subtotal = items.reduce((s: number, i: any) => s + (i.unit_price * i.quantity), 0)
  const discount = subtotal - order.total_amount

  const waNumber = store?.whatsapp ? `62${store.whatsapp.replace(/\D/g, '')}` : null
  const waMessage = waNumber
    ? encodeURIComponent(`Halo, saya ingin konfirmasi pesanan saya:\n\nNo. Order: ${order.order_number}\nTotal: Rp ${order.total_amount.toLocaleString('id-ID')}\n\nMohon konfirmasi pembayarannya. Terima kasih!`)
    : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-card { box-shadow: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print" style={{ backgroundColor: store?.logo_url ? '#fff' : '#f5f5f5', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {store?.logo_url && (
            <img src={store.logo_url} alt={store?.name} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <span style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>{store?.name || 'Toko'}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Konfirmasi via WA
            </a>
          )}
          <a
            href={`/api/invoice/${order.order_number}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </a>
        </div>
      </div>

      {/* Invoice Card */}
      <div style={{ maxWidth: '720px', margin: '24px auto', padding: '0 16px 40px' }}>
        <div className="invoice-card" style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>

          {/* Invoice Header */}
          <div style={{ padding: '28px 32px', borderBottom: '2px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {store?.logo_url && (
                  <img src={store.logo_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                )}
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111', margin: 0 }}>{store?.name || 'Toko'}</h1>
                  {store?.address && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{store.address}</p>}
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Invoice / Bukti Pesanan</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, backgroundColor: statusInfo.bg, color: statusInfo.color, marginBottom: '10px' }}>
                {statusInfo.label}
              </div>
              <p style={{ fontSize: '13px', color: '#374151', fontWeight: 700, margin: '0 0 2px' }}>#{order.order_number}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ padding: '20px 32px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '8px' }}>Diterbitkan Kepada</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{customer?.name || 'Pelanggan'}</p>
            {customer?.phone && <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 2px' }}>📱 {customer.phone}</p>}
            {customer?.address && <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>📍 {customer.address}</p>}
          </div>

          {/* Items Table */}
          <div style={{ padding: '0 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  <th style={{ padding: '14px 0', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Produk</th>
                  <th style={{ padding: '14px 0', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'right' }}>Harga</th>
                  <th style={{ padding: '14px 0', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'center', width: '60px' }}>Qty</th>
                  <th style={{ padding: '14px 0', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product?.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '10px' }}>IMG</div>
                        )}
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: '0 0 2px' }}>{item.product?.name || 'Produk'}</p>
                          {item.product?.sku && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>SKU: {item.product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '13px', color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      Rp {item.unit_price.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: 700, color: '#111', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ padding: '16px 32px 24px', borderTop: '2px solid #f3f4f6' }}>
            <div style={{ maxWidth: '260px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '13px', color: '#6b7280' }}>
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '13px', color: '#16a34a' }}>
                  <span>Diskon</span>
                  <span>-Rp {discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', borderTop: '2px solid #f3f4f6', marginTop: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>Total</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#ee4d2d' }}>Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ margin: '0 32px 24px', padding: '14px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Catatan</p>
              <p style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fafafa', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>
              Terima kasih telah berbelanja di <strong style={{ color: '#374151' }}>{store?.name}</strong>! 🎉
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              Invoice ini diterbitkan otomatis oleh sistem TokoKita.
            </p>
          </div>
        </div>

        {/* Action buttons below card */}
        <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#16a34a', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Konfirmasi via WhatsApp
            </a>
          )}
          <a
            href={`/api/invoice/${order.order_number}`}
            target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </a>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f3f4f6', color: '#374151', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            🖨️ Cetak
          </button>
        </div>
      </div>
    </div>
  )
}
