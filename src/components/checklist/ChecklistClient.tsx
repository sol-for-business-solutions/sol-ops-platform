'use client'
import { useState } from 'react'
import { useChecklist } from '@/hooks/useChecklist'
import { ChecklistPhase } from './ChecklistPhase'
import { ChecklistProgress } from './ChecklistProgress'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLocale } from '@/hooks/useLocale'

interface Course { id: string; title_en: string; title_ar: string; status: string; day1_date: string; day2_date: string }
interface Props { courses: Course[]; initialCourseId: string | null; role: string }

export function ChecklistClient({ courses, initialCourseId, role }: Props) {
  const { t, locale } = useLocale()
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId ?? '')
  const [activePhase, setActivePhase] = useState<'pre' | 'during' | 'post'>('pre')
  const { loading, saving, toggleItem, uploadPhoto, total, completed, percentage, byPhase } = useChecklist(selectedCourseId)
  const canEdit = ['super_admin', 'manager', 'coordinator'].includes(role)

  const phaseKeys = { pre: 'checklist.prePhase', during: 'checklist.duringPhase', post: 'checklist.postPhase' }

  const phaseCompletion = (phase: 'pre' | 'during' | 'post') => {
    const items = byPhase[phase]
    if (items.length === 0) return 0
    return Math.round((items.filter(i => i.is_completed).length / items.length) * 100)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('checklist.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('checklist.subtitle')}</p>
        </div>
      </div>
      {courses.length === 0 ? (
        <EmptyState title={t('checklist.noActiveCourses')} description={t('checklist.noActiveCoursesDesc')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('checklist.selectCourse')}</p>
            <div className="space-y-1.5">
              {courses.map(course => (
                <button key={course.id} onClick={() => setSelectedCourseId(course.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg border text-sm transition-all ${selectedCourseId === course.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
                  <p className="font-medium line-clamp-1">{locale === 'ar' ? course.title_ar : course.title_en}</p>
                  <p className={`text-xs mt-0.5 ${selectedCourseId === course.id ? 'text-gray-300' : 'text-gray-400'}`}>{new Date(course.day1_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            {!selectedCourseId ? (
              <EmptyState title={t('checklist.selectCoursePrompt')} />
            ) : loading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : (
              <>
                <ChecklistProgress total={total} completed={completed} percentage={percentage} />
                <div className="flex gap-2 mb-4">
                  {(['pre', 'during', 'post'] as const).map(phase => {
                    const pct = phaseCompletion(phase)
                    const count = byPhase[phase].length
                    const done = byPhase[phase].filter(i => i.is_completed).length
                    return (
                      <button key={phase} onClick={() => setActivePhase(phase)}
                        className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${activePhase === phase ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}>
                        <div>{t(phaseKeys[phase])}</div>
                        <div className={`text-xs mt-0.5 font-normal ${activePhase === phase ? 'text-gray-300' : 'text-gray-400'}`}>{done}/{count} · {pct}%</div>
                      </button>
                    )
                  })}
                </div>
                <ChecklistPhase items={byPhase[activePhase]} saving={saving} canEdit={canEdit} onToggle={toggleItem} onUploadPhoto={uploadPhoto} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
