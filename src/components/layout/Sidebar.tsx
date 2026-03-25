'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, CheckSquare, Flag,
  MapPin, Users, BarChart2, Award, Settings, Navigation, ClipboardList
} from 'lucide-react'
import { clsx } from 'clsx'
import { useLocale } from '@/hooks/useLocale'
import type { UserRole } from '@/types'

const NAV = [
  { href: '/dashboard',              en: 'Dashboard',    ar: 'لوحة التحكم',  Icon: LayoutDashboard, roles: ['super_admin','manager','coordinator','viewer'] },
  { href: '/dashboard/courses',      en: 'Courses',      ar: 'الدورات',       Icon: BookOpen,         roles: ['super_admin','manager','coordinator','viewer'] },
  { href: '/dashboard/checklists',   en: 'Checklists',   ar: 'قوائم المهام',  Icon: CheckSquare,      roles: ['super_admin','manager','coordinator'] },
  { href: '/dashboard/flags',        en: 'Flags',        ar: 'التنبيهات',     Icon: Flag,             roles: ['super_admin','manager','coordinator'] },
  { href: '/dashboard/checkins',     en: 'Check-in',     ar: 'تسجيل الحضور', Icon: Navigation,       roles: ['super_admin','manager','coordinator'] },
  { href: '/dashboard/attendance',   en: 'Attendance',   ar: 'الحضور',        Icon: MapPin,           roles: ['super_admin','manager','coordinator'] },
  { href: '/dashboard/certificates', en: 'Certificates', ar: 'الشهادات',      Icon: Award,            roles: ['super_admin','manager'] },
  { href: '/dashboard/reports',      en: 'Reports',      ar: 'التقارير',      Icon: BarChart2,        roles: ['super_admin','manager'] },
  { href: '/dashboard/users',        en: 'Users',        ar: 'المستخدمون',    Icon: Users,            roles: ['super_admin'] },
  { href: '/dashboard/audit-log',    en: 'Audit Log',    ar: 'سجل النشاط',    Icon: ClipboardList,    roles: ['super_admin'] },
] as const

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const { locale, isRTL } = useLocale()
  const visible = NAV.filter(n => (n.roles as readonly string[]).includes(role))

  return (
    <aside
      className="w-64 flex flex-col shrink-0 hidden md:flex"
      style={{ background: 'linear-gradient(180deg,#0d1a5c 0%,#142680 50%,#0f1e6e 100%)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className={isRTL ? 'text-right w-full' : ''}>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tight">
              S<span style={{color:'#89e3fd'}}>O</span>L
            </span>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <p className="text-white/90 text-xs font-semibold leading-tight">Operations</p>
              <p className="text-blue-300 text-xs leading-tight">Platform</p>
            </div>
          </div>
          {isRTL && <p className="text-blue-300 text-xs mt-0.5">منصة العمليات</p>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {visible.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isRTL && 'flex-row-reverse',
                isActive
                  ? 'bg-white/15 text-white border-l-[3px] border-[#89e3fd] pl-2.5'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.Icon size={17} className={isActive ? 'text-[#89e3fd]' : ''} />
              <span>{locale === 'ar' ? item.ar : item.en}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#89e3fd]" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10">
        <Link href="/dashboard/settings"
          className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-all', isRTL && 'flex-row-reverse')}>
          <Settings size={17} />
          <span>{locale === 'ar' ? 'الإعدادات' : locale === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </Link>
        <div className="mt-3 mx-1 p-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-blue-300 text-xs text-center">SOL For Business Solutions</p>
        </div>
      </div>
    </aside>
  )
}
