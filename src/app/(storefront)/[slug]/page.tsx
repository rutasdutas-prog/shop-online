import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { StoreChatbot } from '@/components/chat/store-chatbot'
import { AddToCartButton } from '@/components/storefront/add-to-cart-button'
import { ProductVariantPicker } from '@/components/storefront/product-variant-picker'
import { SearchAutocomplete } from '@/components/storefront/search-autocomplete'
import { CategorySidebar } from '@/components/storefront/category-sidebar'
import { StoreSortDropdown } from '@/components/storefront/store-sort-dropdown'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    .select('*')
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
    theme_color: '#18181b',
    hero_title: store.name,
    hero_subtitle: store.description || (lang === 'id' ? 'Selamat datang di toko kami.' : 'Welcome to our store.'),
    corner_style: 'rounded-3xl',
    gradient_from: '#000000',
    gradient_to: '#333333'
  }

  const themeColor = settings.theme_color
  const cornerStyle = settings.corner_style || 'rounded-3xl'

  return (
    <div className="min-h-screen bg-zinc-50" style={{ '--theme-color': themeColor } as React.CSSProperties}>

      {/* ═══════════════════════ HERO / HEADER ═══════════════════════ */}
      <div className="relative bg-white overflow-hidden border-b border-zinc-200/60 min-h-[42svh] md:min-h-[65svh] flex flex-col justify-center">


        {/* Banner */}
        <div className="absolute inset-0 z-0 bg-zinc-900">
          {store.banner_url ? (
            <div className="w-full h-full relative">
              {store.banner_url.includes('.mp4') ? (
                <video src={store.banner_url} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
              ) : (
                <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 via-transparent to-zinc-50" />
            </div>
          ) : (
            <div className="w-full h-full opacity-[0.8]" style={{ background: `linear-gradient(to right, ${settings.gradient_from}, ${settings.gradient_to})` }} />
          )}
        </div>

        <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-20 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-12">
          {/* Logo */}
          <FadeIn delay={0.1} className="shrink-0">
            <div
              className={`w-16 h-16 md:w-40 md:h-40 bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 border-white/50 backdrop-blur-sm ${cornerStyle}`}
              style={{ boxShadow: `0 20px 40px -10px ${themeColor}30` }}
            >
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl md:text-5xl font-bold" style={{ color: themeColor }}>{store.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </FadeIn>

          {/* Store Info */}
          <FadeIn delay={0.2} className="flex-1 text-center md:text-left mt-2 md:mt-6">
            <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight mb-2 md:mb-4 text-white drop-shadow-lg leading-tight">
              {settings.hero_title}
            </h1>
            <p className="text-sm md:text-lg max-w-2xl leading-relaxed mb-4 md:mb-8 mx-auto md:mx-0 text-white/85 drop-shadow-md line-clamp-2 md:line-clamp-none">
              {settings.hero_subtitle}
            </p>

            {/* Search Bar */}
            <div className="w-full mb-4 md:mb-8">
              <SearchAutocomplete storeId={store.id} themeColor={themeColor} />
            </div>

            <div className="hidden md:flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
              {store.whatsapp && (
                <a
                  href={`https://wa.me/62${store.whatsapp}`}
                  target="_blank"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all text-sm"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}
                </a>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs">
                {store.address && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 backdrop-blur-sm border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {store.address}
                  </span>
                )}
                {store.instagram && (
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all bg-white/10 hover:bg-white/20 text-white/90 backdrop-blur-sm border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    @{store.instagram}
                  </a>
                )}
                <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-full border border-green-500/30 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  {lang === 'id' ? 'Buka' : 'Open'}
                </span>
              </div>
            </div>

            {/* Mobile: WA + status row */}
            <div className="md:hidden flex items-center gap-2 flex-wrap">
              {store.whatsapp && (
                <a
                  href={`https://wa.me/62${store.whatsapp}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-semibold shadow"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WA
                </a>
              )}
              <span className="flex items-center gap-1 bg-green-500/20 text-green-300 px-3 py-2 rounded-full border border-green-500/30 text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                {lang === 'id' ? 'Buka' : 'Open'}
              </span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ═══════════════════════ MAIN CONTENT ═══════════════════════ */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR KATEGORI */}
          <CategorySidebar categories={categories || []} storeSlug={slug} themeColor={themeColor} />

          {/* PRODUK GRID */}
          <div className="flex-1 min-w-0">
            <FadeIn delay={0.3}>
              {/* Desktop heading + sort row */}
              <div className="hidden md:flex flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
                  {categorySlug && categories 
                    ? `Produk: ${categories.find(c => c.slug === categorySlug)?.name}` 
                    : dict.storefront.latestProducts}
                  <span className="ml-2 text-sm font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                    {allProducts.length}
                  </span>
                </h2>
                <StoreSortDropdown />
              </div>
            </FadeIn>

        {allProducts.length === 0 ? (
          <FadeIn delay={0.4}>
            <div className={`text-center py-32 ${cornerStyle} border-2 border-dashed border-zinc-200 bg-white`}>
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <p className="text-lg font-semibold text-zinc-900">{dict.storefront.noProducts}</p>
              <p className="text-sm text-zinc-500 mt-2">{lang === 'id' ? 'Toko ini belum menambahkan produk apapun.' : 'This store has not added any products yet.'}</p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-5">
            {allProducts.map((product) => {
              const productVariants: any[] = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : []
              const hasVariants = productVariants.length > 0
              const hasImage = Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string'
              const price = product.price || 0
              const discount = product.discount_price || 0
              const hasDiscount = !hasVariants && discount > 0 && discount < price
              const minVariantPrice = hasVariants ? Math.min(...productVariants.map((v: any) => v.price)) : 0
              const displayPrice = hasVariants ? minVariantPrice : (hasDiscount ? discount : price)
              const percentOff = hasDiscount ? Math.round((1 - discount / price) * 100) : 0
              const stock = hasVariants ? productVariants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : (product.stock ?? null)
              const isOutOfStock = stock !== null && stock <= 0

              return (
                <StaggerItem key={product.id}>
                  <div className={`group bg-white ${cornerStyle} overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-zinc-100 flex flex-col h-full relative ${isOutOfStock ? 'opacity-70' : ''}`}>

                    {/* Badge Diskon */}
                    {hasDiscount && !isOutOfStock && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow">
                          -{percentOff}%
                        </span>
                      </div>
                    )}

                    {/* Badge Habis */}
                    {isOutOfStock && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-zinc-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">
                          {dict.storefront.outOfStock}
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
                      {hasImage ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-300 gap-3">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                      
                      {/* Overlay CTA Desktop Dihapus (Pindah ke bawah seperti Shopee) */}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                      <h3 className="text-xs md:text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug mb-1.5 md:mb-3 group-hover:text-[var(--theme-color)] transition-colors">{product.name}</h3>
                      
                      <div className="mt-auto">
                        {/* Price */}
                        <div className="flex flex-col gap-0.5 mt-2">
                          {hasDiscount && (
                            <span className="text-[10px] text-zinc-400 line-through font-medium">
                              Rp {price.toLocaleString('id-ID')}
                            </span>
                          )}
                          <span className="text-sm md:text-lg font-extrabold tracking-tight" style={{ color: isOutOfStock ? '#a1a1aa' : themeColor }}>
                            {hasVariants ? 'Mulai ' : ''}Rp {displayPrice.toLocaleString('id-ID')}
                          </span>
                          {hasVariants && (
                            <span className="text-[10px] text-zinc-400">{productVariants.length} varian</span>
                          )}
                        </div>
                        
                        {/* CTA Button — full width on all screens */}
                        <div className="mt-2">
                          {hasVariants ? (
                            <ProductVariantPicker variants={productVariants} productName={product.name} themeColor={themeColor} lang={lang} />
                          ) : isOutOfStock ? (
                            <button disabled className="w-full text-zinc-400 bg-zinc-100 text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg cursor-not-allowed">
                              {dict.storefront.outOfStock}
                            </button>
                          ) : store.whatsapp ? (
                            <a
                              href={`https://wa.me/62${store.whatsapp}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk: *${product.name}* (Rp ${displayPrice.toLocaleString('id-ID')})`)}`}
                              target="_blank"
                              className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                              style={{ backgroundColor: themeColor }}
                            >
                              {lang === 'id' ? 'Pesan' : 'Order'}
                            </a>
                          ) : (
                            <AddToCartButton 
                              productName={product.name}
                              className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] md:text-sm font-semibold py-2 md:py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                              style={{ backgroundColor: themeColor }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                              {lang === 'id' ? '+ Keranjang' : '+ Cart'}
                            </AddToCartButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        )}
          </div>
        </div>
      </main>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="bg-white border-t border-zinc-200 mt-8 md:mt-12 py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor }}>
              <span className="text-white text-xs font-bold">TK</span>
            </div>
            <span className="text-sm text-zinc-500 font-medium">
              {lang === 'id' ? 'Ditenagai oleh ' : 'Powered by '}<span className="text-zinc-900 font-bold tracking-tight">TokoKita</span>
            </span>
          </div>
          <Link
            href="/register"
            className="text-sm font-medium hover:underline underline-offset-4 transition-colors"
            style={{ color: themeColor }}
          >
            {lang === 'id' ? 'Buat toko online gratis Anda sendiri →' : 'Create your own free online store →'}
          </Link>
        </div>
      </footer>

      {/* ═══════════════════════ AI CHATBOT ═══════════════════════ */}
      <StoreChatbot
        storeSlug={slug}
        storeName={store.name}
        themeColor={themeColor}
        lang={lang}
      />
    </div>
  )
}
