'use client'
import { useLocale } from '@/hooks/useLocale'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  const isAr = locale === 'ar'

  return (
    <button
      onClick={() => setLocale(isAr ? 'en' : 'ar')}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
      style={{
        background: '#f0f4ff',
        border: '1px solid #dbe4ff',
        color: '#142680',
      }}>
      {isAr
        ? <><span className="text-base leading-none">🇬🇧</span><span>EN</span></>
        : <><span className="text-base leading-none">🇸🇦</span><span>عربي</span></>
      }
    </button>
  )
}
