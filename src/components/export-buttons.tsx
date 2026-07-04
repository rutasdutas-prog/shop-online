'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function ExportButtons({ data, filename, columns }: { data: any[], filename: string, columns: { header: string, dataKey: string }[] }) {
  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text(`Laporan: ${filename}`, 14, 15)
    
    autoTable(doc, {
      startY: 25,
      head: [columns.map(c => c.header)],
      body: data.map(item => columns.map(c => item[c.dataKey] ?? '-')),
    })
    
    doc.save(`${filename}.pdf`)
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map(item => {
        const row: any = {}
        columns.forEach(c => {
          row[c.header] = item[c.dataKey] ?? '-'
        })
        return row
      })
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        PDF
      </button>
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        Excel
      </button>
    </div>
  )
}
