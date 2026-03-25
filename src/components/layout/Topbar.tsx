'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown } from 'lucide-react'
import { LanguageToggle } from './LanguageToggle'
import { useLocale } from '@/hooks/useLocale'
import type { Profile } from '@/types'

const ROLES: Record<string, { en: string; ar: string; color: string }> = {
  super_admin: { en: 'Super Admin', ar: 'مشرف عام',  color: '#7c3aed' },
  manager:     { en: 'Manager',     ar: 'مدير',       color: '#142680' },
  coordinator: { en: 'Coordinator', ar: 'منسق',       color: '#0891b2' },
  viewer:      { en: 'Viewer',      ar: 'مشاهد',      color: '#6b7280' },
}

export function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const { locale, isRTL } = useLocale()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  const name = isRTL && profile.full_name_ar ? profile.full_name_ar : profile.full_name
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const roleInfo = ROLES[profile.role]
  const roleLabel = locale === 'ar' ? roleInfo?.ar : roleInfo?.en
  const roleColor = roleInfo?.color ?? '#142680'

  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 shrink-0"
      style={{borderBottom:'1px solid #e8edf5',boxShadow:'0 1px 8px rgba(20,38,128,0.06)'}}>
      <div />
      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <LanguageToggle />

        {/* Role badge */}
        <span className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{background:`${roleColor}15`,color:roleColor,border:`1px solid ${roleColor}30`}}>
          {roleLabel}
        </span>

        {/* User */}
        <div className={`flex items-center gap-2.5 cursor-pointer group ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{background:'linear-gradient(135deg,#142680,#2B35FF)',boxShadow:'0 2px 8px rgba(20,38,128,0.3)'}}>
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{name}</p>
            <p className="text-xs text-gray-400 leading-tight">{profile.email}</p>
          </div>
        </div>

        {/* Sign out */}
        <button onClick={signOut}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title={isRTL ? 'تسجيل الخروج' : t('auth.signOut')}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
