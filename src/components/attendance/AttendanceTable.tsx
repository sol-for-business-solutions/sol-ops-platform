'use client'
import { CheckCircle2, Circle, Loader2, Award } from 'lucide-react'
import type { Trainee, AttendanceSession } from '@/types'

interface Props { trainees: Trainee[]; session: AttendanceSession; saving: string | null; canEdit: boolean; isPresent: (id: string, session: AttendanceSession) => boolean; getSessionCount: (id: string) => number; isEligible: (id: string) => boolean; onMark: (id: string, session: AttendanceSession, present: boolean) => void; onMarkAll: () => void }

export function AttendanceTable({ trainees, session, saving, canEdit, isPresent, getSessionCount, isEligible, onMark, onMarkAll }: Props) {
  const presentCount = trainees.filter(t => isPresent(t.id, session)).length
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-700">{presentCount} / {trainees.length} present</p>
        {canEdit && <button onClick={onMarkAll} className="text-xs text-gray-500 hover:text-gray-900 underline transition-colors">Mark all present</button>}
      </div>
      <div className="divide-y divide-gray-50">
        {trainees.map(trainee => {
          const present = isPresent(trainee.id, session)
          const count = getSessionCount(trainee.id)
          const eligible = isEligible(trainee.id)
          const isSaving = saving === `${trainee.id}-${session}`
          return (
            <div key={trainee.id} className={`flex items-center gap-4 px-4 py-3 transition-colors ${present ? 'bg-green-50/50' : ''}`}>
              {canEdit ? (
                <button onClick={() => onMark(trainee.id, session, !present)} disabled={isSaving} className="shrink-0 transition-transform active:scale-90 disabled:opacity-50">
                  {isSaving ? <Loader2 size={22} className="animate-spin text-gray-300" /> : present ? <CheckCircle2 size={22} className="text-green-500" /> : <Circle size={22} className="text-gray-200" />}
                </button>
              ) : (
                <div className="shrink-0">{present ? <CheckCircle2 size={22} className="text-green-500" /> : <Circle size={22} className="text-gray-200" />}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="text-sm font-medium text-gray-900 truncate">{trainee.full_name_en}</p>{eligible && <span title="Eligible for certificate"><Award size={13} className="text-amber-500 shrink-0" /></span>}</div>
                <p className="text-xs text-gray-400" dir="rtl">{trainee.full_name_ar}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-0.5">{[0,1,2,3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i < count ? 'bg-green-500' : 'bg-gray-200'}`} />)}</div>
                <p className="text-xs text-gray-400 mt-0.5">{count}/4 sessions</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
