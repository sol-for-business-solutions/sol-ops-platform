'use client'
import { useState } from 'react'
import { useAttendance } from '@/hooks/useAttendance'
import { AttendanceTable } from './AttendanceTable'
import { AddTraineeModal } from './AddTraineeModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserPlus, Award } from 'lucide-react'
import type { AttendanceSession } from '@/types'

const SESSIONS: { key: AttendanceSession; label: string }[] = [
  { key: 'day1_am', label: 'Day 1 · Morning' }, { key: 'day1_pm', label: 'Day 1 · Afternoon' },
  { key: 'day2_am', label: 'Day 2 · Morning' }, { key: 'day2_pm', label: 'Day 2 · Afternoon' },
]

interface Course { id: string; title_en: string; title_ar: string; status: string; day1_date: string; day2_date: string }
interface Props { courses: Course[]; initialCourseId: string | null; role: string }

export function AttendanceClient({ courses, initialCourseId, role }: Props) {
  const [selectedId, setSelectedId] = useState(initialCourseId ?? '')
  const [activeSession, setActiveSession] = useState<AttendanceSession>('day1_am')
  const [showAddModal, setShowAddModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<any>(null)
  const [notifying, setNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<any>(null)
  const { trainees, loading, saving, isPresent, getSessionCount, isEligible, markAttendance, markAllPresent, totalTrainees, eligibleCount, sessionStats, refetch } = useAttendance(selectedId)
  const canEdit = ['super_admin', 'manager', 'coordinator'].includes(role)
  const canGenCert = ['super_admin', 'manager'].includes(role)
  const isMorningSess = activeSession === 'day1_am' || activeSession === 'day2_am'

  async function notifyAbsent() {
    setNotifying(true); setNotifyResult(null)
    const res = await fetch('/api/attendance/absent-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: selectedId, session: activeSession }),
    })
    setNotifyResult(await res.json()); setNotifying(false)
  }

  async function generateCertificates() {
    setGenerating(true); setGenResult(null)
    const res = await fetch('/api/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: selectedId }) })
    setGenResult(await res.json()); setGenerating(false)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Attendance</h1><p className="text-sm text-gray-500 mt-0.5">Track trainee presence across all 4 sessions</p></div>
        {canEdit && selectedId && <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"><UserPlus size={15} />Add trainee</button>}
      </div>
      {courses.length === 0 ? <EmptyState title="No courses available" description="Attendance tracking is available for active courses" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Select course</p>
            <div className="space-y-1.5">
              {courses.map(c => (
                <button key={c.id} onClick={() => { setSelectedId(c.id); setGenResult(null) }}
                  className={`w-full text-left px-3 py-3 rounded-lg border text-sm transition-all ${selectedId === c.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
                  <p className="font-medium line-clamp-1">{c.title_en}</p>
                  <p className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-gray-300' : 'text-gray-400'}`}>{c.status} · {new Date(c.day1_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            {!selectedId ? <EmptyState title="Select a course to track attendance" /> : loading ? <div className="flex justify-center py-16"><Spinner /></div> : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-400 mb-1">Total trainees</p><p className="text-2xl font-semibold text-gray-900">{totalTrainees}</p></div>
                  <div className={`rounded-xl border p-4 ${eligibleCount > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}><p className="text-xs text-gray-400 mb-1">Cert. eligible</p><p className={`text-2xl font-semibold ${eligibleCount > 0 ? 'text-green-700' : 'text-gray-900'}`}>{eligibleCount}</p></div>
                  {sessionStats.slice(0, 2).map(s => (
                    <div key={s.session} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-400 mb-1">{SESSIONS.find(x => x.key === s.session)?.label}</p>
                      <p className="text-2xl font-semibold text-gray-900">{s.present}<span className="text-sm font-normal text-gray-400">/{s.total}</span></p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SESSIONS.map(s => {
                    const stat = sessionStats.find(x => x.session === s.key)
                    return (
                      <button key={s.key} onClick={() => setActiveSession(s.key)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${activeSession === s.key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}>
                        <p className="text-xs">{s.label}</p>
                        <p className={`text-lg font-semibold mt-0.5 ${activeSession === s.key ? 'text-white' : 'text-gray-900'}`}>{stat?.present ?? 0}<span className={`text-xs font-normal ml-0.5 ${activeSession === s.key ? 'text-gray-300' : 'text-gray-400'}`}>/{stat?.total ?? 0}</span></p>
                      </button>
                    )
                  })}
                </div>
                {trainees.length === 0 ? (
                  <EmptyState title="No trainees registered" description="Add trainees to start marking attendance" action={canEdit ? <button onClick={() => setShowAddModal(true)} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Add first trainee</button> : undefined} />
                ) : (
                  <AttendanceTable trainees={trainees} session={activeSession} saving={saving} canEdit={canEdit} isPresent={isPresent} getSessionCount={getSessionCount} isEligible={isEligible} onMark={markAttendance} onMarkAll={() => markAllPresent(activeSession)} />
                )}
                {canGenCert && trainees.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Generate certificates</p>
                        <p className="text-xs text-gray-400 mt-0.5">{eligibleCount} of {totalTrainees} trainees eligible (3+ sessions)</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isMorningSess && (
                          <button onClick={notifyAbsent} disabled={notifying} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40">
                            {notifying ? 'Sending…' : '📩 SMS absent'}
                          </button>
                        )}
                        <button onClick={generateCertificates} disabled={generating || eligibleCount === 0} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40">
                          {generating ? <><Spinner size="sm" /> Generating...</> : <><Award size={15} /> Generate all</>}
                        </button>
                      </div>
                    </div>
                    {notifyResult && (
                      <div className={`p-3 rounded-lg text-sm ${notifyResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {notifyResult.error ? notifyResult.error : `📩 SMS sent to ${notifyResult.notified} absent trainee${notifyResult.notified !== 1 ? 's' : ''} out of ${notifyResult.total_absent} absent`}
                      </div>
                    )}
                    {genResult && (
                      <div className={`p-3 rounded-lg text-sm ${genResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {genResult.error ? genResult.error : `✓ Generated ${genResult.generated} certificate${genResult.generated !== 1 ? 's' : ''}${genResult.skipped > 0 ? ` · ${genResult.skipped} already existed` : ''}${genResult.errors?.length > 0 ? ` · ${genResult.errors.length} upload errors` : ''}`}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {showAddModal && <AddTraineeModal courseId={selectedId} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); refetch() }} />}
    </div>
  )
}
