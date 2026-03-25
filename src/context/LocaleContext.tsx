'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '@/locales/en.json'
import ar from '@/locales/ar.json'

export type Locale = 'en' | 'ar'
const KEY = 'sol-locale'

const TRANSLATIONS = { en, ar } as const

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }

interface CtxValue {
  locale: Locale
  setLocale: (l: Locale) => void
  isRTL: boolean
  t: (key: string) => string
}

const LocaleContext = createContext<CtxValue>({
  locale: 'en',
  setLocale: () => {},
  isRTL: false,
  t: (key: string) => key,
})

// Resolve dot-notation key like "dashboard.title" from nested object
function resolve(obj: any, key: string): string {
  const parts = key.split('.')
  let cur = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key
    cur = cur[part]
  }
  return typeof cur === 'string' ? cur : key
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Locale | null
      if (saved === 'ar' || saved === 'en') { setLocaleState(saved); apply(saved) }
    } catch {}
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(KEY, l)
      document.cookie = `sol-locale=${l};path=/;max-age=31536000;samesite=lax`
      apply(l)
    } catch {}
  }, [])

  const t = useCallback((key: string): string => {
    const translations = TRANSLATIONS[locale] as any
    const result = resolve(translations, key)
    // fallback to English if key missing in Arabic
    if (result === key && locale === 'ar') {
      return resolve(TRANSLATIONS.en as any, key)
    }
    return result
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isRTL: locale === 'ar', t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

function apply(l: Locale) {
  try {
    document.documentElement.setAttribute('lang', l)
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr')
  } catch {}
}
