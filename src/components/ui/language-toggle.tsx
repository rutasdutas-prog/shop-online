'use client'

import { useTransition } from 'react'
import { setLanguage } from '@/actions/language.actions'
import { Locale } from '@/lib/i18n/dictionaries'

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const [isPending, startTransition] = useTransition()

  const handleLanguageChange = (locale: Locale) => {
    if (locale === currentLocale || isPending) return
    startTransition(async () => {
      await setLanguage(locale)
    })
  }

  return (
    <div className={`flex items-center bg-zinc-200/80 p-0.5 rounded-full border border-zinc-300/50 shadow-inner ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      <button
        onClick={() => handleLanguageChange('id')}
        className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
          currentLocale === 'id'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        ID
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
          currentLocale === 'en'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        EN
      </button>
    </div>
  )
}
