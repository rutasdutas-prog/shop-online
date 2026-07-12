'use client'

import { useState } from 'react'
import Link from 'next/link'

const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Noir',
    desc: 'Elegan gelap premium',
    theme_color: '#6366f1',
    gradient_from: '#0f0c29',
    gradient_to: '#302b63',
    corner_style: 'rounded-3xl',
    preview: ['from-[#0f0c29]', 'to-[#302b63]'],
    accent: 'bg-indigo-500',
    emoji: '🌙',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold Luxe',
    desc: 'Mewah & feminin',
    theme_color: '#e11d48',
    gradient_from: '#c94b4b',
    gradient_to: '#4b134f',
    corner_style: 'rounded-3xl',
    preview: ['from-[#c94b4b]', 'to-[#4b134f]'],
    accent: 'bg-rose-500',
    emoji: '🌹',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    desc: 'Segar & profesional',
    theme_color: '#0284c7',
    gradient_from: '#0ea5e9',
    gradient_to: '#0369a1',
    corner_style: 'rounded-xl',
    preview: ['from-[#0ea5e9]', 'to-[#0369a1]'],
    accent: 'bg-sky-500',
    emoji: '🌊',
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    desc: 'Natural & organik',
    theme_color: '#16a34a',
    gradient_from: '#134e4a',
    gradient_to: '#065f46',
    corner_style: 'rounded-xl',
    preview: ['from-[#134e4a]', 'to-[#065f46]'],
    accent: 'bg-emerald-500',
    emoji: '🌿',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    desc: 'Hangat & energetik',
    theme_color: '#f59e0b',
    gradient_from: '#92400e',
    gradient_to: '#d97706',
    corner_style: 'rounded-3xl',
    preview: ['from-[#92400e]', 'to-[#d97706]'],
    accent: 'bg-amber-500',
    emoji: '✨',
  },
]

interface ThemePickerClientProps {
  settings: any
  storeSlug: string
  updateAction: (formData: FormData) => Promise<void>
  successMsg?: string
  errorMsg?: string
}

export default function ThemePickerClient({ settings, storeSlug, updateAction, successMsg, errorMsg }: ThemePickerClientProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(settings.theme_name || 'custom')
  const [themeColor, setThemeColor] = useState(settings.theme_color || '#000000')
  const [gradientFrom, setGradientFrom] = useState(settings.gradient_from || '#000000')
  const [gradientTo, setGradientTo] = useState(settings.gradient_to || '#333333')
  const [cornerStyle, setCornerStyle] = useState(settings.corner_style || 'rounded-3xl')
  const [heroTitle, setHeroTitle] = useState(settings.hero_title || '')
  const [heroSubtitle, setHeroSubtitle] = useState(settings.hero_subtitle || '')

  const applyTheme = (theme: typeof THEMES[0]) => {
    setSelectedThemeId(theme.id)
    setThemeColor(theme.theme_color)
    setGradientFrom(theme.gradient_from)
    setGradientTo(theme.gradient_to)
    setCornerStyle(theme.corner_style)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Tampilan Toko</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Pilih tema atau atur tampilan toko Anda secara bebas.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      <form action={updateAction} className="space-y-4">
        {/* Hidden fields for current state */}
        <input type="hidden" name="theme_name" value={selectedThemeId} />
        <input type="hidden" name="theme_color" value={themeColor} />
        <input type="hidden" name="gradient_from" value={gradientFrom} />
        <input type="hidden" name="gradient_to" value={gradientTo} />
        <input type="hidden" name="corner_style" value={cornerStyle} />

        {/* 5 Theme Cards */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-4">🎨 Pilih Tema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => applyTheme(theme)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all text-left group hover:scale-[1.02] ${
                  selectedThemeId === theme.id
                    ? 'border-zinc-900 shadow-lg ring-2 ring-zinc-900 ring-offset-2'
                    : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {/* Gradient preview box */}
                <div
                  className="h-20 w-full relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${theme.gradient_from}, ${theme.gradient_to})` }}
                >
                  {/* Animated shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {/* Fake product card overlay */}
                  <div className="absolute bottom-2 right-2 w-8 h-10 rounded bg-white/20 backdrop-blur-sm border border-white/30" />
                  <div className="absolute bottom-2 right-12 w-5 h-10 rounded bg-white/15 backdrop-blur-sm border border-white/20" />
                  {/* Emoji badge */}
                  <span className="absolute top-2 left-2 text-base">{theme.emoji}</span>
                  {/* Accent dot */}
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white/50" style={{ background: theme.theme_color }} />
                </div>
                <div className="p-2.5 bg-white">
                  <p className="text-xs font-semibold text-zinc-800 leading-none">{theme.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{theme.desc}</p>
                </div>
                {selectedThemeId === theme.id && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}

            {/* Custom theme card */}
            <button
              type="button"
              onClick={() => setSelectedThemeId('custom')}
              className={`relative rounded-xl overflow-hidden border-2 transition-all text-left hover:scale-[1.02] ${
                selectedThemeId === 'custom'
                  ? 'border-zinc-900 shadow-lg ring-2 ring-zinc-900 ring-offset-2'
                  : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <div
                className="h-20 w-full relative"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
              >
                <span className="absolute top-2 left-2 text-base">🎛️</span>
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white/50" style={{ background: themeColor }} />
              </div>
              <div className="p-2.5 bg-white">
                <p className="text-xs font-semibold text-zinc-800 leading-none">Custom</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Atur sendiri bebas</p>
              </div>
              {selectedThemeId === 'custom' && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Banner */}
        <div className="rounded-xl overflow-hidden shadow-md border border-zinc-200">
          <div
            className="h-24 flex items-center px-6 relative overflow-hidden transition-all duration-500"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
            <div className="relative z-10">
              <p className="text-white font-bold text-lg leading-tight drop-shadow">{heroTitle || 'Judul Toko Anda'}</p>
              <p className="text-white/80 text-xs mt-0.5 drop-shadow">{heroSubtitle || 'Subtitle toko...'}</p>
              <div className="mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full text-white" style={{ background: themeColor }}>
                Lihat Produk →
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 px-4 py-2 text-[10px] text-zinc-400 text-center">👁 Live Preview Banner</div>
        </div>

        {/* Custom Color Controls */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-800">🎨 Kustomisasi Warna</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Warna Tombol / Aksen</p>
              <div className="flex items-center gap-2">
                <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200 p-0.5" />
                <span className="text-xs text-zinc-400 font-mono">{themeColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Gradient Mulai (From)</p>
              <div className="flex items-center gap-2">
                <input type="color" value={gradientFrom} onChange={e => { setGradientFrom(e.target.value); setSelectedThemeId('custom') }}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200 p-0.5" />
                <span className="text-xs text-zinc-400 font-mono">{gradientFrom}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Gradient Akhir (To)</p>
              <div className="flex items-center gap-2">
                <input type="color" value={gradientTo} onChange={e => { setGradientTo(e.target.value); setSelectedThemeId('custom') }}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200 p-0.5" />
                <span className="text-xs text-zinc-400 font-mono">{gradientTo}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <h3 className="text-xs font-medium text-zinc-600 mb-3">Gaya Sudut Kartu Produk</h3>
            <div className="flex items-center gap-3">
              {[
                { label: 'Tajam', value: 'rounded-none' },
                { label: 'Sedang', value: 'rounded-xl' },
                { label: 'Melengkung', value: 'rounded-3xl' },
              ].map(opt => (
                <label key={opt.value} className="cursor-pointer">
                  <input type="radio" name="corner_style_radio" value={opt.value}
                    checked={cornerStyle === opt.value}
                    onChange={() => setCornerStyle(opt.value)}
                    className="sr-only" />
                  <div className={`flex items-center justify-center w-28 h-10 border text-xs font-medium transition-all ${
                    cornerStyle === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  } rounded-lg`}>
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Teks Banner */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-800">📝 Teks Banner Toko</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Judul Utama</label>
            <input name="hero_title" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} required
              placeholder="Selamat Datang di Toko Kami"
              className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Sub-judul</label>
            <textarea name="hero_subtitle" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={2}
              placeholder="Temukan produk-produk terbaik dengan harga terjangkau."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link href={`/${storeSlug}`} target="_blank" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
            ↗ Preview toko publik
          </Link>
          <button type="submit"
            className="bg-zinc-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors">
            Simpan Tampilan
          </button>
        </div>
      </form>
    </div>
  )
}
