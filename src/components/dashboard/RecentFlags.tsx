'use client'
import { useFlags } from '@/hooks/useFlags'
import { Spinner } from '@/components/ui/Spinner'
import { useLocale } from '@/hooks/useLocale'
import Link from 'next/link'

const SEV: Record<string, { dot: string; bg: string; text: string; key: string }> = {
  info:      { dot: '#142680', bg: '#eff6ff', text: '#1d4ed8', key: 'severity.info' },
  warning:   { dot: '#d97706', bg: '#fffbeb', text: '#92400e', key: 'severity.warning' },
  critical:  { dot: '#ea580c', bg: '#fff7ed', text: '#9a3412', key: 'severity.critical' },
  emergency: { dot: '#dc2626', bg: '#fef2f2', text: '#991b1b', key: 'severity.emergency' },
}

export function RecentFlags() {
  const { flags, loading } = useFlags({ status: 'open' })
  const { t } = useLocale()

  function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    return m < 1 ? t('common.justNow') : m < 60 ? `${m}${t('common.minsAgo')}` : `${Math.floor(m/60)}${t('common.hoursAgo')}`
  }

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (flags.length === 0) return (
    <div className="flex items-center justify-center py-8 gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#f0fdf4'}}>
        <span className="text-green-500 text-sm">✓</span>
      </div>
      <p className="text-sm text-gray-400">{t('dashboard.noOpenFlagsMsg')}</p>
    </div>
  )
  return (
    <div className="space-y-2">
      {flags.slice(0, 6).map((flag: any) => {
        const s = SEV[flag.severity] ?? SEV.info
        return (
          <Link key={flag.id} href={`/dashboard/flags?course=${flag.course_id}`}
            className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 group"
            style={{border:'1px solid #f0f4ff'}}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:s.bg}}>
              <div className={`w-2 h-2 rounded-full ${flag.severity==='emergency'?'animate-pulse':''}`} style={{background:s.dot}} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{background:s.bg,color:s.text}}>{t(s.key)}</span>
                <span className="text-xs text-gray-400 truncate">{flag.course?.title_en}</span>
              </div>
              <p className="text-sm text-gray-700 truncate mt-0.5">{flag.description}</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(flag.created_at)}</span>
          </Link>
        )
      })}
    </div>
  )
}
