'use client'
import Link from 'next/link'
import { MapPin, Calendar, Users, ArrowUpRight } from 'lucide-react'
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

export function CourseCard({ course }: Props) {
  const coordinators = course.course_assignments ?? []
  const accent = STATUS_COLORS[course.status] ?? '#142680'
  return (
    <Link href={`/dashboard/courses/${course.id}`}
      className="block group bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{border:'1px solid #e8edf5',boxShadow:'0 1px 8px rgba(20,38,128,0.04)','--hover-shadow':'0 8px 24px rgba(20,38,128,0.12)'} as any}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(20,38,128,0.12)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 8px rgba(20,38,128,0.04)'}>
      {/* Color bar */}
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
  )
}
