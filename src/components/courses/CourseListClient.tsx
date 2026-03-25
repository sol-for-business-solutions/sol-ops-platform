'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, SlidersHorizontal, Upload } from 'lucide-react'
import { useCourses } from '@/hooks/useCourses'
import { useCities } from '@/hooks/useCities'
import { CourseCard } from './CourseCard'
import { BulkCourseImportModal } from './BulkCourseImportModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLocale } from '@/hooks/useLocale'

export function CourseListClient({ role }: { role: string }) {
  const { t, locale } = useLocale()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [cityId, setCityId] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const { courses, loading, refetch } = useCourses({ status: status || undefined, city_id: cityId || undefined, search: search || undefined })
  const { cities } = useCities()
  const canCreate = ['super_admin', 'manager'].includes(role)

  const STATUS_OPTIONS = [
    { value: '', label: t('courses.allStatuses') },
    { value: 'draft', label: t('status.draft') },
    { value: 'scheduled', label: t('status.scheduled') },
    { value: 'in_progress', label: t('status.in_progress') },
    { value: 'completed', label: t('status.completed') },
    { value: 'archived', label: t('status.archived') },
  ]

  const selectClass = "px-3 py-2.5 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2"
  const selectStyle = {border:'1px solid #e8edf5',color:'#374151','--tw-ring-color':'#142680'} as React.CSSProperties

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('courses.title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {courses.length} {courses.length !== 1 ? t('courses.coursesFoundPlural') : t('courses.coursesFound')}
          </p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBulk(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload size={15} />{t('courses.bulkImport')}
            </button>
            <Link href="/dashboard/courses/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary">
              <Plus size={16} />{t('courses.newCourse')}
            </Link>
          </div>
        )}
      </div>

      <div className="sol-card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={t('courses.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50"
              style={{border:'1px solid #e8edf5','--tw-ring-color':'#142680'} as React.CSSProperties} />
          </div>
          <div className="flex items-center gap-1 text-gray-400"><SlidersHorizontal size={15} /></div>
          <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass} style={selectStyle}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={cityId} onChange={e => setCityId(e.target.value)} className={selectClass} style={selectStyle}>
            <option value="">{t('courses.allCities')}</option>
            {cities.map(c => <option key={c.id} value={c.id}>{locale === 'ar' ? c.name_ar : c.name_en}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : courses.length === 0 ? (
        <EmptyState title={t('courses.noCoursesFound')} description={t('courses.tryAdjustFilters')}
          action={canCreate ? <Link href="/dashboard/courses/new" className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl sol-btn-primary">{t('courses.createFirstCourse')}</Link> : undefined} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(course => <CourseCard key={course.id} course={course} role={role} onUpdate={refetch} />)}
        </div>
      )}

      {showBulk && <BulkCourseImportModal onClose={() => setShowBulk(false)} onSuccess={() => { setShowBulk(false); refetch() }} />}
    </div>
  )
}
