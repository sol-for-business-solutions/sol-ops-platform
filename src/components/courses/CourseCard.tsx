'use client'
import Link from 'next/link'
import { MapPin, Calendar, Users, ArrowUpRight, Copy } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, statusLabels } from '@/lib/courseUtils'
import type { Course, CourseStatus } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af', scheduled: '#142680', in_progress: '#d97706', completed: '#16a34a', archived: '#9ca3af'
}

interface Props {
  course: Course & { city?: { name_en: string }; course_assignments?: { coordinator: { full_name: string } }[] }
  role: string; onUpdate: () => void
}

export function CourseCard({ course, role, onUpdate }: Props) {
  const coordinators = course.course_assignments ?? []
  const accent = STATUS_COLORS[course.status] ?? '#142680'
  const canClone = ['super_admin', 'manager'].includes(role)
  const [cloning, setCloning] = useState(false)

  async function handleClone(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (cloning) return
    setCloning(true)
    try {
      const res = await fetch(`/api/courses/${course.id}/clone`, { method: 'POST' })
      if (res.ok) { onUpdate() }
    } finally {
      setCloning(false)
    }
  }

  return (
    <div className="relative group">
      <Link href={`/dashboard/courses/${course.id}`}
        className="block bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
        style={{border:'1px solid #e8edf5',boxShadow:'0 1px 8px rgba(20,38,128,0.04)'}}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(20,38,128,0.12)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 8px rgba(20,38,128,0.04)'}>
        <div className="h-1" style={{background:`linear-gradient(90deg,${accent},${accent}88)`}} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge label={statusLabels[course.status as CourseStatus] ?? course.status} variant={course.status} />
            <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#142680] transition-colors mt-0.5" />
          </div>
          <h3 className="font-bold text-gray-900 mb-0.5 line-clamp-1 group-hover:text-[#142680] transition-colors">{course.title_en}</h3>
          <p className="text-sm text-gray-400 mb-4 line-clamp-1" dir="rtl">{course.title_ar}</p>
          <div className="space-y-2 pt-3" style={{borderTop:'1px solid #f0f4ff'}}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={13} className="shrink-0" style={{color:'#142680'}} />
              <span className="truncate">{course.city?.name_en ?? '—'} · {course.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={13} className="shrink-0" style={{color:'#142680'}} />
              <span>{formatDate(course.day1_date)} → {formatDate(course.day2_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={13} className="shrink-0" style={{color:'#142680'}} />
              <span className="truncate">{coordinators.length > 0 ? coordinators.map(a => a.coordinator?.full_name).join(', ') : 'No coordinator'}</span>
            </div>
          </div>
        </div>
      </Link>
      {canClone && (
        <button
          onClick={handleClone}
          title="Clone this course"
          className="absolute bottom-3 right-3 p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-[#142680] hover:border-[#142680] transition-colors opacity-0 group-hover:opacity-100">
          {cloning ? <span className="text-xs px-1">…</span> : <Copy size={13} />}
        </button>
      )}
    </div>
  )
}
