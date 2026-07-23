import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { StoreChatbot } from '@/components/chat/store-chatbot'
import { SearchAutocomplete } from '@/components/storefront/search-autocomplete'
import { CategorySidebar } from '@/components/storefront/category-sidebar'
import { StoreSortDropdown } from '@/components/storefront/store-sort-dropdown'
import ProductCard from '@/components/storefront/product-card'
import { CartPanel } from '@/components/storefront/cart-panel'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function StorefrontPage(
  props: { 
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { slug } = params
  
  const categorySlug = typeof searchParams.category === 'string' ? searchParams.category : null
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : 'latest'

  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .single()

  if (!store) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('store_id', store.id)
    .order('name')

  let categoryId = null
  if (categorySlug && categories) {
    const cat = categories.find(c => c.slug === categorySlug)
    if (cat) categoryId = cat.id
  }

  let productsQuery = supabase
    .from('products')
    .select('id, name, price, discount_price, images, stock, status, variants, category_id, store_id')
    .eq('store_id', store.id)
    .in('status', ['PUBLISHED', 'ACTIVE'])

  if (categoryId) {
    productsQuery = productsQuery.eq('category_id', categoryId)
  }

  if (sortParam === 'price_asc') {
    productsQuery = productsQuery.order('price', { ascending: true })
  } else if (sortParam === 'price_desc') {
    productsQuery = productsQuery.order('price', { ascending: false })
  } else {
    productsQuery = productsQuery.order('created_at', { ascending: false })
  }

  const { data: products } = await productsQuery

  const lang = await getLanguage()
  const dict = dictionaries[lang]

  const allProducts = products || []
  const settings = store.theme_settings || {
    theme_color: '#6366f1',
    hero_title: store.name,
    hero_subtitle: store.description || (lang === 'id' ? 'Selamat datang di toko kami.' : 'Welcome to our store.'),
    corner_style: 'rounded-xl',
    gradient_from: '#0f0c29',
    gradient_to: '#302b63'
  }

  const themeColor = settings.theme_color
  const cornerStyle = settings.corner_style || 'rounded-xl'

  const getInstagramUrl = (ig: string) =>
    ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace(/^@/, '')}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── TOP HEADER (Shopee-style) ── */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: themeColor }}>
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-3 flex items-center gap-3 md:gap-6">
          {/* Logo + Name */}
          <Link href={`/${slug}`} className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/40">
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.name} width={44} height={44} className="object-cover w-full h-full" />
              ) : (
                <span className="text-white font-bold text-lg">{store.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-white font-bold text-sm md:text-base truncate max-w-[120px] md:max-w-xs hidden sm:block drop-shadow">
              {store.name}
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <SearchAutocomplete storeId={store.id} themeColor={themeColor} />
          </div>

          {/* WA Button Desktop */}
          {store.whatsapp && (
            <a
              href={`https://wa.me/62${store.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              className="hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/30 transition-all shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat
            </a>
          )}
        </div>

        {/* Sub-header: store info bar */}
        <div className="border-t border-white/15" style={{ backgroundColor: 'rgba(0,0,0,0.10)' }}>
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-1.5 flex items-center gap-4 overflow-x-auto scrollbar-none text-xs text-white/80">
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
              {lang === 'id' ? 'Toko Aktif' : 'Store Active'}
            </span>
            {store.address && (
              <span className="flex items-center gap-1 shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {store.address}
              </span>
            )}
            {store.instagram && (
              <a href={getInstagramUrl(store.instagram)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors shrink-0">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                @{store.instagram.replace(/^@/, '')}
              </a>
            )}
            {allProducts.length > 0 && (
              <span className="shrink-0">{allProducts.length} {lang === 'id' ? 'Produk' : 'Products'}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER (if banner_url exists) ── */}
      {store.banner_url && (
        <div className="w-full overflow-hidden" style={{ maxHeight: '220px' }}>
          {store.banner_url.includes('.mp4') ? (
            <video src={store.banner_url} autoPlay loop muted playsInline className="w-full object-cover" style={{ maxHeight: '220px' }} />
          ) : (
            <div className="relative w-full" style={{ height: '180px' }}>
              <Image src={store.banner_url} alt={store.name} fill className="object-cover" priority sizes="100vw" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(245,245,245,1) 100%)' }} />
            </div>
          )}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        
        {/* Store description strip */}
        {settings.hero_subtitle && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm text-gray-600 bg-white border border-gray-100 shadow-sm">
            {settings.hero_subtitle}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Category Sidebar / Mobile Pills */}
          <CategorySidebar categories={categories || []} storeSlug={slug} themeColor={themeColor} />

          <div className="flex-1 min-w-0">
            {/* Sort + heading bar */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-sm md:text-base font-bold text-gray-700">
                {categorySlug && categories
                  ? categories.find(c => c.slug === categorySlug)?.name ?? 'Produk'
                  : lang === 'id' ? 'Semua Produk' : 'All Products'}
                <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {allProducts.length}
                </span>
              </h2>
              <StoreSortDropdown />
            </div>

            {/* Product Grid */}
            {allProducts.length === 0 ? (
              <FadeIn delay={0.2}>
                <div className="text-center py-24 rounded-2xl border border-dashed border-gray-200 bg-white">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-50">
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <p className="text-base font-semibold text-gray-500">{dict.storefront.noProducts}</p>
                  <p className="text-sm text-gray-400 mt-1">{lang === 'id' ? 'Toko ini belum menambahkan produk.' : 'No products yet.'}</p>
                </div>
              </FadeIn>
            ) : (
              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                {allProducts.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard
                      product={product}
                      store={store}
                      themeColor={themeColor}
                      lang={lang}
                      dict={dict}
                      cornerStyle={cornerStyle}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-10 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: themeColor }}>
              <span className="text-white text-xs font-bold">TK</span>
            </div>
            <span>
              {lang === 'id' ? 'Ditenagai oleh ' : 'Powered by '}
              <span className="font-bold text-gray-600">TokoKita</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {store.whatsapp && (
              <a href={`https://wa.me/62${store.whatsapp.replace(/\D/g, '')}`} target="_blank"
                className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            <Link href="/register" className="hover:underline" style={{ color: themeColor }}>
              {lang === 'id' ? 'Buat toko gratis →' : 'Create free store →'}
            </Link>
          </div>
        </div>
      </footer>

      <CartPanel storeId={store.id} themeColor={themeColor} lang={lang} whatsapp={store.whatsapp} />
      <StoreChatbot storeSlug={slug} storeName={store.name} themeColor={themeColor} lang={lang} />
    </div>
  )
}
