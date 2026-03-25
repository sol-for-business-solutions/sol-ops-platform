'use client'
import { useLocale } from '@/hooks/useLocale'
import { useEffect, useState } from 'react'

interface Flag {
  id: string
  severity: string
  category: string
  status: string
  created_at: string
  resolved_at?: string
  course?: { city?: { name_en: string } }
}

interface Props { flags: Flag[] }

const SEVERITY_COLORS: Record<string, string> = {
  info: '#378ADD', warning: '#BA7517', critical: '#D85A30', emergency: '#E24B4A'
}
const CATEGORY_LABELS: Record<string, string> = {
  trainer_issue: 'Trainer', venue_issue: 'Venue', equipment_failure: 'Equipment',
  low_turnout: 'Low Turnout', medical_emergency: 'Medical', other: 'Other'
}

export function FlagAnalytics({
  const { t } = useLocale() flags }: Props) {
  // Count by severity
  const bySeverity = ['info', 'warning', 'critical', 'emergency'].map(s => ({
    key: s, label: s.charAt(0).toUpperCase() + s.slice(1),
    count: flags.filter(f => f.severity === s).length,
    color: SEVERITY_COLORS[s],
  }))

  // Count by category
  const byCategory = Object.keys(CATEGORY_LABELS).map(c => ({
    key: c, label: CATEGORY_LABELS[c],
    count: flags.filter(f => f.category === c).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  // Count by status
  const byStatus = ['open', 'acknowledged', 'in_progress', 'resolved'].map(s => ({
    key: s, label: s.replace('_', ' '),
    count: flags.filter(f => f.status === s).length,
  }))

  // Average resolution time
  const resolved = flags.filter(f => f.status === 'resolved' && f.resolved_at)
  const avgResHours = resolved.length > 0
    ? resolved.reduce((sum, f) => {
        const ms = new Date(f.resolved_at!).getTime() - new Date(f.created_at).getTime()
        return sum + ms / 3600000
      }, 0) / resolved.length
    : null

  // By city
  const cityMap = new Map<string, number>()
  flags.forEach(f => {
    const city = (f.course as any)?.city?.name_en ?? 'Unknown'
    cityMap.set(city, (cityMap.get(city) ?? 0) + 1)
  })
  const byCity = Array.from(cityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const maxSev = Math.max(...bySeverity.map(s => s.count), 1)
  const maxCat = Math.max(...byCategory.map(c => c.count), 1)
  const maxCity = Math.max(...byCity.map(c => c[1]), 1)

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total flags</p>
          <p className="text-2xl font-semibold text-gray-900">{flags.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Open / Unresolved</p>
          <p className="text-2xl font-semibold text-orange-600">{flags.filter(f => f.status !== 'resolved').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Resolved</p>
          <p className="text-2xl font-semibold text-green-600">{resolved.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Avg. resolution time</p>
          <p className="text-2xl font-semibold text-gray-900">
            {avgResHours !== null ? (avgResHours < 1 ? `${Math.round(avgResHours * 60)}m` : `${avgResHours.toFixed(1)}h`) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Severity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Flags by severity</h3>
          <div className="space-y-3">
            {bySeverity.map(s => (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 capitalize">{s.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(s.count / maxSev) * 100}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Flags by category</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(c => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{c.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{c.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-gray-600 rounded-full transition-all duration-500"
                      style={{ width: `${(c.count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Resolution status</h3>
          <div className="flex items-end gap-4 h-24">
            {byStatus.map((s, i) => {
              const maxSt = Math.max(...byStatus.map(x => x.count), 1)
              const pct = s.count / maxSt
              const colors = ['#E24B4A', '#BA7517', '#185FA5', '#3B6D11']
              return (
                <div key={s.key} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-semibold text-gray-700">{s.count}</span>
                  <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${Math.max(pct * 72, 4)}px`, background: colors[i] }} />
                  <span className="text-xs text-gray-500 text-center capitalize leading-tight">{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* By City */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top cities by flag count</h3>
          {byCity.length === 0 ? (
            <p className="text-sm text-gray-400">No city data available</p>
          ) : (
            <div className="space-y-2">
              {byCity.map(([city, count]) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-28 truncate">{city}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-[#142680] rounded-full transition-all duration-500" style={{ width: `${(count / maxCity) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
