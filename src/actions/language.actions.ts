'use server'

import { cookies } from 'next/headers'
import { Locale } from '@/lib/i18n/dictionaries'
import { revalidatePath } from 'next/cache'

export async function setLanguage(locale: Locale) {
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  })
  
  // Revalidate the root path to refresh all pages
  revalidatePath('/', 'layout')
}

export async function getLanguage(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value as Locale
  return locale === 'en' ? 'en' : 'id'
}
