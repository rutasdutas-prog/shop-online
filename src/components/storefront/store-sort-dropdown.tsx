'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function StoreSortDropdown() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'latest'
  const currentCategory = searchParams.get('category')

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams()
    
    if (currentCategory) {
      params.set('category', currentCategory)
    }
    
    if (value !== 'latest') {
      params.set('sort', value)
    }
    
    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-sm font-medium hidden sm:block" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Urutkan:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleChange}
        className="text-sm py-2 px-3 pr-8 rounded-lg focus:outline-none appearance-none cursor-pointer"
        style={{
          backgroundColor: 'rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em'
        }}
      >
        <option value="latest" className="text-zinc-900">Paling Baru</option>
        <option value="price_asc" className="text-zinc-900">Harga: Termurah</option>
        <option value="price_desc" className="text-zinc-900">Harga: Termahal</option>
      </select>
    </div>
  )
}
