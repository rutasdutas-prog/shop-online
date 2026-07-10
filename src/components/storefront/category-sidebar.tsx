'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategorySidebarProps {
  categories: Category[]
  storeSlug: string
  themeColor: string
}

export function CategorySidebar({ categories, storeSlug, themeColor }: CategorySidebarProps) {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')
  const currentSort = searchParams.get('sort')

  const buildUrl = (categorySlug: string | null) => {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (currentSort) params.set('sort', currentSort)
    
    const queryString = params.toString()
    return `/${storeSlug}${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="w-full lg:w-64 shrink-0 mb-8 lg:mb-0">
      <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm sticky top-24">
        <h3 className="font-bold text-lg mb-6 text-zinc-900 border-b border-zinc-100 pb-4">
          Kategori Produk
        </h3>
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada kategori.</p>
        ) : (
          <ul className="space-y-1">
            <li>
              <Link 
                href={buildUrl(null)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !currentCategory 
                    ? 'bg-zinc-100 text-zinc-900' 
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
                style={!currentCategory ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
              >
                Semua Produk
              </Link>
            </li>
            
            {categories.map(cat => {
              const isActive = currentCategory === cat.slug
              return (
                <li key={cat.id}>
                  <Link 
                    href={buildUrl(cat.slug)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-zinc-100 text-zinc-900' 
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                    style={isActive ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
                  >
                    {cat.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
