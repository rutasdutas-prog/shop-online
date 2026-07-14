'use client'

import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

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
  const router = useRouter()
  const pathname = usePathname()
  const currentCategory = searchParams.get('category')
  const currentSort = searchParams.get('sort')

  const buildUrl = (categorySlug: string | null) => {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (currentSort) params.set('sort', currentSort)
    const qs = params.toString()
    return `/${storeSlug}${qs ? `?${qs}` : ''}`
  }

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    if (value !== 'latest') params.set('sort', value)
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const currentCategoryLabel = currentCategory
    ? categories.find(c => c.slug === currentCategory)?.name ?? 'Semua'
    : 'Semua Produk'

  return (
    <>
      {/* MOBILE: Horizontal pill scroll */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          <Link
            href={buildUrl(null)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border"
            style={!currentCategory
              ? { backgroundColor: themeColor, color: '#fff', borderColor: themeColor, boxShadow: `0 0 12px ${themeColor}50` }
              : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            Semua
          </Link>
          {categories.map(cat => {
            const isActive = currentCategory === cat.slug
            return (
              <Link
                key={cat.id}
                href={buildUrl(cat.slug)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border"
                style={isActive
                  ? { backgroundColor: themeColor, color: '#fff', borderColor: themeColor, boxShadow: `0 0 12px ${themeColor}50` }
                  : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>

        {/* Mobile sort + heading */}
        <div className="flex items-center justify-between mt-3 mb-1">
          <span className="text-xs text-white/40 font-medium">{currentCategoryLabel}</span>
          <select
            value={currentSort || 'latest'}
            onChange={e => handleSortChange(e.target.value)}
            className="text-xs py-1.5 px-3 pr-7 rounded-lg focus:outline-none appearance-none cursor-pointer"
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.12)',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.4rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.2em 1.2em',
            }}
          >
            <option value="latest">Terbaru</option>
            <option value="price_asc">Termurah</option>
            <option value="price_desc">Termahal</option>
          </select>
        </div>
      </div>

      {/* DESKTOP: Sidebar */}
      <div className="hidden lg:block w-52 shrink-0">
        <div
          className="rounded-2xl p-5 sticky top-24"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h3
            className="font-bold text-xs mb-4 pb-3 uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.40)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            Kategori
          </h3>
          <ul className="space-y-0.5">
            <li>
              <Link
                href={buildUrl(null)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={!currentCategory
                  ? { backgroundColor: `${themeColor}25`, color: themeColor }
                  : { color: 'rgba(255,255,255,0.60)' }}
              >
                <span>Semua Produk</span>
                {!currentCategory && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />}
              </Link>
            </li>
            {categories.map(cat => {
              const isActive = currentCategory === cat.slug
              return (
                <li key={cat.id}>
                  <Link
                    href={buildUrl(cat.slug)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
                    style={isActive
                      ? { backgroundColor: `${themeColor}25`, color: themeColor }
                      : { color: 'rgba(255,255,255,0.60)' }}
                  >
                    <span>{cat.name}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}
