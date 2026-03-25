'use client'
import { useState, useEffect } from 'react'
import { Plus, BarChart2 } from 'lucide-react'
import { useFlags } from '@/hooks/useFlags'
import { FlagCard } from './FlagCard'
import { FlagAnalytics } from './FlagAnalytics'
import { RaiseFlagModal } from './RaiseFlagModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLocale } from '@/hooks/useLocale'

interface Course { id: string; title_en: string; title_ar: string; status: string }
interface Props { courses: Course[]; initialCourseId: string | null; role: string; userId: string }

function useAllFlags(courseId: string) {
  const [flags, setFlags] = useState<any[]>([])
  useEffect(() => {
    const url = courseId ? `/api/flags?course_id=${courseId}&include_course=1` : '/api/flags?include_course=1'
    fetch(url).then(r => r.json()).then(d => setFlags(Array.isArray(d) ? d : []))
  }, [courseId])
  return flags
}

export function FlagsClient({ courses, initialCourseId, role }: Props) {
  const { t, locale } = useLocale()
  const [courseId, setCourseId] = useState(initialCourseId ?? '')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list')
  const { flags, loading, refetch, updateFlagStatus } = useFlags({ course_id: courseId || undefined, severity: severity || undefined, status: status || undefined })
  const allFlags = useAllFlags(courseId)
  const canRaise = ['super_admin', 'manager', 'coordinator'].includes(role)
  const canResolve = ['super_admin', 'manager'].includes(role)
  const openFlags = flags.filter(f => f.status !== 'resolved')
  const emergencyCount = openFlags.filter(f => f.severity === 'emergency').length
  const criticalCount = openFlags.filter(f => f.severity === 'critical').length

  const SEVERITY_OPTIONS = [
    { value: '', label: t('flags.allSeverities') },
    { value: 'info', label: `🔵 ${t('severity.info')}` },
    { value: 'warning', label: `🟡 ${t('severity.warning')}` },
    { value: 'critical', label: `🟠 ${t('severity.critical')}` },
    { value: 'emergency', label: `🔴 ${t('severity.emergency')}` },
  ]
  const STATUS_OPTIONS = [
    { value: '', label: t('flags.allStatuses') },
    { value: 'open', label: t('flags.status.open') },
    { value: 'acknowledged', label: t('flags.status.acknowledged') },
    { value: 'in_progress', label: t('flags.status.in_progress') },
    { value: 'resolved', label: t('flags.status.resolved') },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('flags.title')}</h1>
          <div className="flex items-center gap-3 mt-1">
            {emergencyCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium animate-pulse">{emergencyCount} {t('severity.emergency')}</span>}
            {criticalCount > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">{criticalCount} {t('severity.critical')}</span>}
            {emergencyCount === 0 && criticalCount === 0 && <span className="text-xs text-gray-400">{openFlags.length} {openFlags.length !== 1 ? t('flags.openFlags') : t('flags.openFlag')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setActiveTab('list')} className={`px-3 py-2 text-sm ${activeTab === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{t('flags.list')}</button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-1.5 px-3 py-2 text-sm border-l border-gray-200 ${activeTab === 'analytics' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}><BarChart2 size={14} />{t('flags.analytics')}</button>
          </div>
          {canRaise && <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"><Plus size={16} />{t('flags.raise')}</button>}
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <FlagAnalytics flags={allFlags} />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
              <option value="">{t('flags.allCourses')}</option>
              {courses.map(c => <option key={c.id} value={c.id}>{locale === 'ar' ? c.title_ar : c.title_en}</option>)}
            </select>
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
              {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {loading ? <div className="flex justify-center py-16"><Spinner /></div> : flags.length === 0 ? (
            <EmptyState title={t('flags.noFlags')} description={t('flags.noFlagsDesc')}
              action={canRaise ? <button onClick={() => setShowModal(true)} className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">{t('flags.raiseFirstFlag')}</button> : undefined} />
          ) : (
            <div className="space-y-3">{flags.map((flag: any) => <FlagCard key={flag.id} flag={flag} canResolve={canResolve} onStatusUpdate={updateFlagStatus} />)}</div>
          )}
        </>
      )}
      {showModal && <RaiseFlagModal courses={courses} initialCourseId={courseId} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); refetch() }} />}
    </div>
  )
}
