'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type Locale = 'en' | 'ar'
const KEY = 'sol-locale'

interface CtxValue {
  locale: Locale
  setLocale: (l: Locale) => void
  isRTL: boolean
}

const LocaleContext = createContext<CtxValue>({ locale: 'en', setLocale: () => {}, isRTL: false })

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

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isRTL: locale === 'ar' }}>
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
