import Link from 'next/link'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations'
import { getLanguage } from '@/actions/language.actions'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { LanguageToggle } from '@/components/ui/language-toggle'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const lang = await getLanguage()
  const dict = dictionaries[lang]

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-indigo-500/30 selection:text-indigo-200" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <span className="text-white text-xs font-bold">TK</span>
            </div>
            <span className="font-semibold text-zinc-100 text-lg tracking-tight">TokoKita</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle currentLocale={lang} />
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium hidden sm:block">
              {lang === 'id' ? 'Masuk' : 'Login'}
            </Link>
            <Link href="/register" className="text-sm bg-white text-zinc-950 px-5 py-2.5 rounded-full hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all font-semibold shadow-xl shadow-white/10">
              {dict.homepage.ctaFree}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden pt-16 pb-12">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <StaggerContainer>
            <StaggerItem>
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-md">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                {lang === 'id' ? 'Platform SaaS e-Commerce Indonesia v2.0' : 'Indonesian e-Commerce SaaS Platform v2.0'}
              </div>
            </StaggerItem>
            
            <StaggerItem>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-tight leading-[1.1] mb-8">
                {dict.homepage.heroTitle.split(' ').slice(0, 3).join(' ')}<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {dict.homepage.heroTitle.split(' ').slice(3).join(' ')}
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                {dict.homepage.heroSubtitle}
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full text-base font-semibold hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {dict.homepage.ctaOpenStore}
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {lang === 'id' ? 'Sudah punya akun? Masuk' : 'Already have an account? Login'}
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 px-6 relative z-10 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                {lang === 'id' ? 'Teknologi Modern ' : 'Modern Technology '}<br/><span className="text-zinc-500">{lang === 'id' ? 'untuk Bisnis Anda' : 'for Your Business'}</span>
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🎨', title: lang === 'id' ? 'Desain Premium' : 'Premium Design', desc: lang === 'id' ? 'Tinggalkan template usang. Berikan pelanggan Anda pengalaman berbelanja ala brand kelas atas.' : 'Leave outdated templates behind. Give your customers a high-end brand shopping experience.' },
              { icon: '⚡', title: lang === 'id' ? 'Super Cepat' : 'Lightning Fast', desc: lang === 'id' ? 'Dibangun dengan teknologi Next.js terbaru. Waktu muat instan tanpa lag untuk tingkatkan konversi.' : 'Built with the latest Next.js technology. Instant load times without lag to increase conversions.' },
              { icon: '📱', title: 'Mobile First', desc: lang === 'id' ? 'Desain yang sempurna di setiap layar smartphone, siap menyambut mayoritas pembeli mobile.' : 'Perfect design on every smartphone screen, ready to welcome the majority of mobile buyers.' },
              { icon: '🤖', title: 'Smart CMS', desc: lang === 'id' ? 'Atur warna, banner, dan tampilan toko dalam hitungan detik. Semua ter-update seketika.' : 'Manage colors, banners, and store appearance in seconds. Everything updates instantly.' },
              { icon: '📊', title: lang === 'id' ? 'Analitik Live' : 'Live Analytics', desc: lang === 'id' ? 'Pantau penjualan, jumlah pesanan, dan pendapatan secara real-time dari dashboard mewah.' : 'Monitor sales, order volume, and revenue in real-time from a luxurious dashboard.' },
              { icon: '🛍️', title: lang === 'id' ? 'Manajemen Produk' : 'Product Management', desc: lang === 'id' ? 'Atur diskon nominal/persentase, stok otomatis, hingga foto produk layaknya profesional.' : 'Manage flat/percentage discounts, automated stock, and product photos like a professional.' },
            ].map((f, i) => (
              <StaggerItem key={i}>
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 hover:bg-zinc-900 hover:border-white/10 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/5">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-zinc-950 pointer-events-none" />
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">{lang === 'id' ? 'Siap Memulai?' : 'Ready to Start?'}</h2>
            <p className="text-xl text-zinc-400 mb-10">{lang === 'id' ? 'Daftar sekarang dan nikmati akses ke seluruh fitur tanpa batas selama masa percobaan.' : 'Sign up now and enjoy unlimited access to all features during the trial period.'}</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-zinc-950 px-10 py-5 rounded-full font-bold text-lg hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
              {lang === 'id' ? 'Buat Toko Gratis 🚀' : 'Create Free Store 🚀'}
            </Link>
          </div>
        </FadeIn>
      </section>

    </div>
  )
}
