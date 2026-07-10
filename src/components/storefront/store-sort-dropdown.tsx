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
      <label htmlFor="sort" className="text-sm font-medium text-zinc-500 hidden sm:block">
        Urutkan:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleChange}
        className="text-sm bg-white border border-zinc-200 text-zinc-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 appearance-none shadow-sm cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em'
        }}
      >
        <option value="latest">Paling Baru</option>
        <option value="price_asc">Harga: Termurah</option>
        <option value="price_desc">Harga: Termahal</option>
      </select>
    </div>
  )
}
