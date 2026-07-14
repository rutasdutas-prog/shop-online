'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  images: string[] | null
  stock_level: number
  is_low: boolean
  variants?: any[]
}

interface InventoryExportButtonsProps {
  items: InventoryItem[]
  filename?: string
}

// Fetch gambar dari URL dan ubah ke base64 Data URL
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function InventoryExportButtons({ items, filename = 'Inventaris' }: InventoryExportButtonsProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [xlsLoading, setXlsLoading] = useState(false)

  /* ─── PDF WITH IMAGES ─── */
  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // Header
      doc.setFontSize(16)
      doc.setTextColor(24, 24, 27)
      doc.text('Laporan Inventaris Produk', 14, 16)
      doc.setFontSize(8)
      doc.setTextColor(113, 113, 122)
      doc.text(`Diekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} pukul ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, 14, 22)

      // Create flattened list
      const flattenedItems: { id: string; name: string; sku: string; stock: number; isLow: boolean; image: string | null }[] = []
      items.forEach(item => {
        if (item.variants && item.variants.length > 0) {
          item.variants.forEach((v, idx) => {
            flattenedItems.push({
              id: `${item.id}-v${idx}`,
              name: `${item.name} - ${v.name}`,
              sku: item.sku || '—',
              stock: Number(v.stock) || 0,
              isLow: Number(v.stock) <= 5,
              image: v.imageUrl?.startsWith('http') ? v.imageUrl : (item.images?.[0] || null)
            })
          })
        } else {
          flattenedItems.push({
            id: item.id,
            name: item.name,
            sku: item.sku || '—',
            stock: item.stock_level,
            isLow: item.is_low,
            image: item.images?.[0] || null
          })
        }
      })

      // Pre-fetch all images
      const imageMap: Record<string, string | null> = {}
      await Promise.all(
        flattenedItems.map(async (fItem) => {
          if (fItem.image) {
            imageMap[fItem.id] = await imageUrlToBase64(fItem.image)
          } else {
            imageMap[fItem.id] = null
          }
        })
      )

      const ROW_HEIGHT = 18 // mm per row
      const IMG_SIZE = 13   // mm image size
      const COL_WIDTHS = [18, 80, 30, 20, 22] // Foto | Nama | SKU | Stok | Status
      const HEADERS = ['Foto', 'Nama Produk / Varian', 'SKU', 'Stok', 'Status']
      const MARGIN_LEFT = 14
      const PAGE_WIDTH = 210
      const COL_STARTS = COL_WIDTHS.reduce<number[]>((acc, w, i) => {
        acc.push(i === 0 ? MARGIN_LEFT : acc[i - 1] + COL_WIDTHS[i - 1])
        return acc
      }, [])

      let y = 28

      // Draw header row
      doc.setFillColor(24, 24, 27)
      doc.rect(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT * 2, 7, 'F')
      doc.setFontSize(7.5)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      HEADERS.forEach((h, i) => {
        doc.text(h, COL_STARTS[i] + 2, y + 5)
      })
      y += 7

      doc.setFont('helvetica', 'normal')

      for (let idx = 0; idx < flattenedItems.length; idx++) {
        const item = flattenedItems[idx]

        // Check page break
        if (y + ROW_HEIGHT > 280) {
          doc.addPage()
          y = 14
        }

        // Alternating row background
        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 248)
          doc.rect(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT * 2, ROW_HEIGHT, 'F')
        }

        // Row border bottom
        doc.setDrawColor(228, 228, 231)
        doc.line(MARGIN_LEFT, y + ROW_HEIGHT, PAGE_WIDTH - MARGIN_LEFT, y + ROW_HEIGHT)

        // Image cell
        const b64 = imageMap[item.id]
        if (b64) {
          try {
            const imgX = COL_STARTS[0] + (COL_WIDTHS[0] - IMG_SIZE) / 2
            const imgY = y + (ROW_HEIGHT - IMG_SIZE) / 2
            doc.addImage(b64, 'JPEG', imgX, imgY, IMG_SIZE, IMG_SIZE)
          } catch {
            // If image fails, draw placeholder
            doc.setFillColor(228, 228, 231)
            doc.rect(COL_STARTS[0] + 2, y + 2, IMG_SIZE, IMG_SIZE, 'F')
            doc.setFontSize(6)
            doc.setTextColor(161, 161, 170)
            doc.text('Foto', COL_STARTS[0] + 4, y + 10)
          }
        } else {
          doc.setFillColor(241, 241, 245)
          doc.rect(COL_STARTS[0] + 2, y + 2, IMG_SIZE, IMG_SIZE, 'F')
          doc.setFontSize(5.5)
          doc.setTextColor(161, 161, 170)
          doc.text('No Photo', COL_STARTS[0] + 3, y + 10)
        }

        // Name (wrap if long)
        doc.setFontSize(8)
        doc.setTextColor(24, 24, 27)
        const nameLines = doc.splitTextToSize(item.name, COL_WIDTHS[1] - 4)
        doc.text(nameLines.slice(0, 2), COL_STARTS[1] + 2, y + 6)

        // SKU
        doc.setFontSize(7)
        doc.setTextColor(113, 113, 122)
        doc.text(item.sku, COL_STARTS[2] + 2, y + ROW_HEIGHT / 2 + 2)

        // Stock
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(24, 24, 27)
        doc.text(String(item.stock), COL_STARTS[3] + 2, y + ROW_HEIGHT / 2 + 2)
        doc.setFont('helvetica', 'normal')

        // Status badge
        const statusText = item.isLow ? 'Rendah' : 'Aman'
        const statusColor = item.isLow ? [254, 226, 226] : [220, 252, 231]
        const statusTextColor = item.isLow ? [185, 28, 28] : [21, 128, 61]
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
        doc.roundedRect(COL_STARTS[4] + 1, y + ROW_HEIGHT / 2 - 4, 18, 7, 2, 2, 'F')
        doc.setFontSize(7)
        doc.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2])
        doc.setFont('helvetica', 'bold')
        doc.text(statusText, COL_STARTS[4] + 10, y + ROW_HEIGHT / 2 + 1, { align: 'center' })
        doc.setFont('helvetica', 'normal')

        y += ROW_HEIGHT
      }

      // Footer
      doc.setFontSize(7)
      doc.setTextColor(161, 161, 170)
      doc.text(`Total: ${items.length} produk`, MARGIN_LEFT, y + 6)

      doc.save(`${filename}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  /* ─── EXCEL WITH IMAGE URL ─── */
  const handleExportExcel = async () => {
    setXlsLoading(true)
    try {
      // Flatten items for Excel as well
      const rows: any[] = []
      items.forEach(item => {
        if (item.variants && item.variants.length > 0) {
          item.variants.forEach((v) => {
            rows.push({
              'URL Foto': v.imageUrl?.startsWith('http') ? v.imageUrl : (item.images?.[0] || ''),
              'Nama Produk / Varian': `${item.name} - ${v.name}`,
              'SKU': item.sku || '-',
              'Stok': Number(v.stock) || 0,
              'Status': Number(v.stock) <= 5 ? 'Rendah ⚠️' : 'Aman ✅',
            })
          })
        } else {
          rows.push({
            'URL Foto': item.images?.[0] || '',
            'Nama Produk / Varian': item.name,
            'SKU': item.sku || '-',
            'Stok': item.stock_level,
            'Status': item.is_low ? 'Rendah ⚠️' : 'Aman ✅',
          })
        }
      })

      const ws = XLSX.utils.json_to_sheet(rows)

      // Set column widths
      ws['!cols'] = [
        { wch: 55 }, // URL Foto
        { wch: 35 }, // Nama Produk
        { wch: 16 }, // SKU
        { wch: 10 }, // Stok
        { wch: 12 }, // Status
      ]

      // Bold header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[cellAddr]) continue
        ws[cellAddr].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '18181B' } },
          alignment: { horizontal: 'center' },
        }
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventaris')

      // Add info sheet
      const infoData = [
        ['Catatan', 'Kolom "URL Foto" berisi link gambar produk. Buka di browser untuk melihat gambar.'],
        ['Diekspor', `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} pukul ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`],
        ['Total Produk', items.length],
        ['Stok Rendah', items.filter(i => i.is_low).length],
      ]
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
      wsInfo['!cols'] = [{ wch: 16 }, { wch: 60 }]
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Info')

      XLSX.writeFile(wb, `${filename}.xlsx`)
    } finally {
      setXlsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportPDF}
        disabled={pdfLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pdfLoading ? (
          <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {pdfLoading ? 'Membuat PDF...' : 'PDF'}
      </button>

      <button
        onClick={handleExportExcel}
        disabled={xlsLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {xlsLoading ? (
          <span className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {xlsLoading ? 'Membuat Excel...' : 'Excel'}
      </button>
    </div>
  )
}
