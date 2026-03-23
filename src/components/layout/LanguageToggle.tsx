'use client'
import { useLocale } from '@/hooks/useLocale'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  return (
    <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
      style={{background:'#f5f6fa',border:'1px solid #e8edf5',color:'#142680'}}>
      {locale === 'en' ? <><span>🇸🇦</span><span>عربي</span></> : <><span>🇬🇧</span><span>EN</span></>}
    </button>
  )
}
