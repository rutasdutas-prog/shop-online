'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus } from '@/actions/order.actions'

interface OrderStatusSelectProps {
  orderId: string
  initialStatus: string
}

export function OrderStatusSelect({ orderId, initialStatus }: OrderStatusSelectProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus)
      if (!res.success) {
        alert('Gagal merubah status: ' + res.error)
        setStatus(initialStatus) // revert
      }
    })
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs font-semibold px-2 py-1 rounded-full border outline-none cursor-pointer transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'} ${
        status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
        status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
        status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
        'bg-zinc-100 text-zinc-700 border-zinc-200'
      }`}
    >
      <option value="PENDING" className="bg-white text-zinc-800">Menunggu</option>
      <option value="PAID" className="bg-white text-zinc-800">Paid</option>
      <option value="COMPLETED" className="bg-white text-zinc-800">Delivered</option>
    </select>
  )
}
