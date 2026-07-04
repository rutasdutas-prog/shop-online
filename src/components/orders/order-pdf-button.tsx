'use client'

import { useState } from 'react'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: {
    name: string
    images?: string[]
    sku?: string
  }
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  notes?: string
  customer?: {
    name: string
    phone?: string
    email?: string
    address?: string
  }
  order_items?: OrderItem[]
}

interface OrderPdfButtonProps {
  order: Order
  storeName: string
}

export function OrderPdfButton({ order, storeName }: OrderPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const generatePdf = async () => {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const margin = 15
      let y = margin

      // ── HEADER ──
      doc.setFillColor(24, 24, 27)
      doc.rect(0, 0, pageW, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(storeName, margin, 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('INVOICE / BUKTI PESANAN', margin, 24)
      doc.setFontSize(10)
      doc.text(`#${order.order_number}`, pageW - margin, 20, { align: 'right' })

      y = 45

      // ── INFO PESANAN ──
      doc.setTextColor(24, 24, 27)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Informasi Pesanan', margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      const statusMap: Record<string, string> = {
        PENDING: 'Menunggu', PAID: 'Dibayar', PROCESSING: 'Diproses',
        COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan', REFUNDED: 'Dikembalikan'
      }
      doc.text(`Tanggal: ${new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y)
      doc.text(`Status: ${statusMap[order.status] || order.status}`, pageW / 2, y)
      y += 5
      if (order.customer) {
        doc.text(`Pembeli: ${order.customer.name}`, margin, y)
        if (order.customer.phone) doc.text(`Telepon: ${order.customer.phone}`, pageW / 2, y)
        y += 5
        if (order.customer.address) {
          const addrLines = doc.splitTextToSize(`Alamat: ${order.customer.address}`, pageW - margin * 2 - 5)
          doc.text(addrLines, margin, y)
          y += addrLines.length * 5
        }
      }
      if (order.notes) {
        y += 2
        doc.setTextColor(120, 80, 0)
        const noteLines = doc.splitTextToSize(`Catatan: ${order.notes}`, pageW - margin * 2)
        doc.text(noteLines, margin, y)
        y += noteLines.length * 5
        doc.setTextColor(80, 80, 80)
      }

      y += 6

      // ── TABLE HEADER ──
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y, pageW - margin * 2, 7, 'F')
      doc.setTextColor(24, 24, 27)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Foto', margin + 2, y + 5)
      doc.text('Produk', margin + 22, y + 5)
      doc.text('Harga', pageW - margin - 60, y + 5)
      doc.text('Qty', pageW - margin - 35, y + 5)
      doc.text('Subtotal', pageW - margin - 15, y + 5, { align: 'right' })
      y += 8

      // ── TABLE ROWS ──
      const items = order.order_items || []
      for (const item of items) {
        const rowH = 22
        if (y + rowH > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage()
          y = margin
        }

        doc.setDrawColor(230, 230, 230)
        doc.rect(margin, y, pageW - margin * 2, rowH, 'S')

        // Product image
        const imageUrl = item.product?.images?.[0]
        if (imageUrl) {
          try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const reader = new FileReader()
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            const ext = imageUrl.split('.').pop()?.toUpperCase() || 'JPEG'
            const imgFormat = ext === 'PNG' ? 'PNG' : 'JPEG'
            doc.addImage(base64, imgFormat, margin + 1, y + 1, 18, 20)
          } catch {
            // skip image on error
          }
        } else {
          doc.setFillColor(230, 230, 230)
          doc.rect(margin + 1, y + 1, 18, 20, 'F')
          doc.setFontSize(7)
          doc.setTextColor(180, 180, 180)
          doc.text('No\nImg', margin + 6, y + 10)
        }

        // Text
        doc.setTextColor(24, 24, 27)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        const productName = item.product?.name || 'Produk tidak dikenal'
        const nameLines = doc.splitTextToSize(productName, 70)
        doc.text(nameLines, margin + 22, y + 7)

        if (item.product?.sku) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(120, 120, 120)
          doc.text(`SKU: ${item.product.sku}`, margin + 22, y + 7 + nameLines.length * 4)
        }

        // Price, qty, subtotal
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        doc.text(`Rp ${item.unit_price.toLocaleString('id-ID')}`, pageW - margin - 60, y + 11)
        doc.text(`x${item.quantity}`, pageW - margin - 35, y + 11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(24, 24, 27)
        doc.text(`Rp ${item.subtotal.toLocaleString('id-ID')}`, pageW - margin - 2, y + 11, { align: 'right' })

        y += rowH + 1
      }

      // ── TOTAL ──
      y += 4
      doc.setDrawColor(24, 24, 27)
      doc.setLineWidth(0.5)
      doc.line(pageW - margin - 70, y, pageW - margin, y)
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(24, 24, 27)
      doc.text('TOTAL', pageW - margin - 68, y)
      doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageW - margin, y, { align: 'right' })

      // ── FOOTER ──
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.setFont('helvetica', 'normal')
      doc.text(`Terima kasih telah berbelanja di ${storeName}!`, pageW / 2, pageH - 10, { align: 'center' })
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageW / 2, pageH - 6, { align: 'center' })

      doc.save(`invoice-${order.order_number}.pdf`)
    } catch (err) {
      console.error('PDF Error:', err)
      alert('Gagal membuat PDF. Silakan coba lagi.')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={generatePdf}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-400 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {loading ? 'Membuat PDF...' : 'Download PDF'}
    </button>
  )
}
