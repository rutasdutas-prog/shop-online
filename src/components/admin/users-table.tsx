'use client'

import { useState, useTransition } from 'react'
import { suspendUser, restoreUser, deleteUser } from '@/actions/admin.actions'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface ConfirmDialog {
  type: 'suspend' | 'restore' | 'delete'
  userId: string
  userName: string
  currentRole: string
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  OWNER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  STAFF: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  CUSTOMER: 'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
  SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function UsersTable({ users, currentUserId }: { users: User[], currentUserId: string }) {
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = () => {
    if (!confirm) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('user_id', confirm.userId)
      if (confirm.type === 'suspend') {
        await suspendUser(fd)
      } else if (confirm.type === 'restore') {
        fd.append('prev_role', confirm.currentRole === 'SUSPENDED' ? 'OWNER' : confirm.currentRole)
        await restoreUser(fd)
      } else {
        await deleteUser(fd)
      }
      setConfirm(null)
    })
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cari nama, email, atau role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">✕</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pengguna</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tgl Daftar</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => {
                const isMe = u.id === currentUserId
                const isSuspended = u.role === 'SUSPENDED'
                const isSuperAdmin = u.role === 'SUPER_ADMIN'
                return (
                  <tr key={u.id} className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-violet-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSuspended ? 'bg-red-900/40 text-red-300' : 'bg-zinc-800 text-zinc-300'}`}>
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            {u.full_name || '-'}
                            {isMe && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">Anda</span>}
                          </div>
                          <div className="text-xs text-zinc-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${roleColors[u.role] || roleColors.CUSTOMER}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-500">{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isMe && !isSuperAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          {isSuspended ? (
                            <button
                              onClick={() => setConfirm({ type: 'restore', userId: u.id, userName: u.full_name || u.email, currentRole: u.role })}
                              disabled={isPending}
                              className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                              Pulihkan
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirm({ type: 'suspend', userId: u.id, userName: u.full_name || u.email, currentRole: u.role })}
                              disabled={isPending}
                              className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => setConfirm({ type: 'delete', userId: u.id, userName: u.full_name || u.email, currentRole: u.role })}
                            disabled={isPending}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                      {(isMe || isSuperAdmin) && (
                        <span className="text-xs text-zinc-700 italic">Terlindungi</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-zinc-600 text-sm">
                    {search ? `Tidak ada pengguna yang cocok dengan "${search}"` : 'Belum ada pengguna terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto ${
              confirm.type === 'delete' ? 'bg-red-500/15' : confirm.type === 'suspend' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
            }`}>
              {confirm.type === 'delete' ? '🗑️' : confirm.type === 'suspend' ? '🔒' : '🔓'}
            </div>
            <h3 className="text-base font-bold text-white text-center mb-2">
              {confirm.type === 'delete' ? 'Hapus Pengguna?' : confirm.type === 'suspend' ? 'Suspend Pengguna?' : 'Pulihkan Pengguna?'}
            </h3>
            <p className="text-sm text-zinc-400 text-center mb-1">
              {confirm.type === 'delete'
                ? 'Tindakan ini akan menghapus pengguna beserta toko mereka secara permanen.'
                : confirm.type === 'suspend'
                ? 'Pengguna tidak dapat login dan akses toko mereka.'
                : 'Pengguna dapat login kembali ke sistem.'}
            </p>
            <p className="text-sm font-semibold text-white text-center mb-5">
              "{confirm.userName}"
            </p>
            {confirm.type === 'delete' && (
              <p className="text-xs text-red-400 text-center mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                ⚠️ Semua data dan toko pengguna ini akan ikut terhapus. Tidak bisa dibatalkan!
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 ${
                  confirm.type === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : confirm.type === 'suspend'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isPending ? '...' : confirm.type === 'delete' ? 'Ya, Hapus' : confirm.type === 'suspend' ? 'Ya, Suspend' : 'Ya, Pulihkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
