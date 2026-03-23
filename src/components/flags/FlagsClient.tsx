'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFlags } from '@/hooks/useFlags'
import { FlagCard } from './FlagCard'
import { RaiseFlagModal } from './RaiseFlagModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface Course { id: string; title_en: string; status: string }
interface Props { courses: Course[]; initialCourseId: string | null; role: string; userId: string }

const SEVERITY_OPTIONS = [{ value: '', label: 'All severities' },{ value: 'info', label: '🔵 Info' },{ value: 'warning', label: '🟡 Warning' },{ value: 'critical', label: '🟠 Critical' },{ value: 'emergency', label: '🔴 Emergency' }]
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' },{ value: 'open', label: 'Open' },{ value: 'acknowledged', label: 'Acknowledged' },{ value: 'in_progress', label: 'In Progress' },{ value: 'resolved', label: 'Resolved' }]

export function FlagsClient({ courses, initialCourseId, role }: Props) {
  const [courseId, setCourseId] = useState(initialCourseId ?? '')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { flags, loading, refetch, updateFlagStatus } = useFlags({ course_id: courseId || undefined, severity: severity || undefined, status: status || undefined })
  const canRaise = ['super_admin', 'manager', 'coordinator'].includes(role)
  const canResolve = ['super_admin', 'manager'].includes(role)
  const openFlags = flags.filter(f => f.status !== 'resolved')
  const emergencyCount = openFlags.filter(f => f.severity === 'emergency').length
  const criticalCount = openFlags.filter(f => f.severity === 'critical').length
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Flags</h1>
          <div className="flex items-center gap-3 mt-1">
            {emergencyCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium animate-pulse">{emergencyCount} Emergency</span>}
            {criticalCount > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">{criticalCount} Critical</span>}
            {emergencyCount === 0 && criticalCount === 0 && <span className="text-xs text-gray-400">{openFlags.length} open flag{openFlags.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>
        {canRaise && <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"><Plus size={16} />Raise flag</button>}
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={courseId} onChange={e => setCourseId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}
        </select>
        <select value={severity} onChange={e => setSeverity(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner /></div> : flags.length === 0 ? (
        <EmptyState title="No flags found" description="Flags raised by coordinators will appear here in real-time"
          action={canRaise ? <button onClick={() => setShowModal(true)} className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Raise first flag</button> : undefined} />
      ) : (
        <div className="space-y-3">{flags.map((flag: any) => <FlagCard key={flag.id} flag={flag} canResolve={canResolve} onStatusUpdate={updateFlagStatus} />)}</div>
      )}
      {showModal && <RaiseFlagModal courses={courses} initialCourseId={courseId} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); refetch() }} />}
    </div>
  )
}
