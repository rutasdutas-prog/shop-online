'use client'

import { useState } from 'react'
import { updateStock } from '@/actions/inventory.actions'

export function InventoryRow({ item }: { item: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [stock, setStock] = useState(item.stock_level)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.append('product_id', item.id)
    formData.append('stock_level', stock.toString())
    
    await updateStock(formData)
    setIsEditing(false)
    setLoading(false)
  }

  return (
    <tr className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
            {item.images && item.images[0] ? (
              <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-zinc-400">📦</span>
            )}
          </div>
          <span className="font-medium text-zinc-800 text-sm">{item.name}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-zinc-500 text-xs">{item.sku || '—'}</td>
      <td className="px-5 py-3 text-center">
        {item.has_variants ? (
          <div className="flex flex-col items-center justify-center gap-1.5 group">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900">{item.stock_level}</span>
              <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded" title="Total stok semua varian">Multi Varian</span>
            </div>
            <div className="text-left w-full text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-100 rounded p-1.5 space-y-1">
              {(item.variants || []).map((v: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="truncate pr-2">{v.name}</span>
                  <span className={`font-semibold ${v.stock <= 5 ? 'text-red-500' : 'text-zinc-700'}`}>{v.stock}</span>
                </div>
              ))}
            </div>
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSave} className="flex items-center justify-center gap-2">
            <input 
              type="number" 
              value={stock} 
              onChange={e => setStock(parseInt(e.target.value) || 0)}
              className="w-16 h-8 text-center text-sm border border-zinc-200 rounded-md outline-none focus:border-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
            <button type="submit" disabled={loading} className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 p-1 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-3 group">
            <span className="font-semibold text-zinc-900">{item.stock_level}</span>
            <button onClick={() => setIsEditing(true)} className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 p-1 rounded transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>
        )}
      </td>
      <td className="px-5 py-3 text-center">
        {item.is_low ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 font-medium">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            Rendah
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-600 font-medium">
            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
            Aman
          </span>
        )}
      </td>
    </tr>
  )
}
