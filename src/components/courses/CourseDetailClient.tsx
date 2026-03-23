'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Users, Edit, Trash2, ChevronLeft, UserPlus, CheckCircle, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, statusLabels } from '@/lib/courseUtils'
import type { Course, Profile, CourseStatus } from '@/types'

const NEXT: Record<string, string> = { draft:'scheduled', scheduled:'in_progress', in_progress:'completed', completed:'archived' }

interface Props {
  course: Course & { city?: any; course_assignments?: { id: string; coordinator: Profile }[] }
  allCoordinators: Profile[]; role: string
}

export function CourseDetailClient({ course, allCoordinators, role }: Props) {
  const router = useRouter()
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(course.course_assignments?.map(a => a.coordinator.id) ?? [])
  const [saving, setSaving] = useState(false)
  const canEdit = ['super_admin', 'manager'].includes(role)

  async function saveAssignments() {
    setSaving(true)
    await fetch(`/api/courses/${course.id}/assign`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ coordinator_ids: selectedIds }) })
    setSaving(false); setAssignOpen(false); router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this course? This cannot be undone.')) return
    await fetch(`/api/courses/${course.id}`, { method:'DELETE' })
    router.push('/dashboard/courses')
  }

  async function updateStatus(status: string) {
    await fetch(`/api/courses/${course.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    router.refresh()
  }

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors" style={{color:'#142680'}}>
        <ChevronLeft size={16} /> Back to courses
      </Link>

      <div className="sol-card overflow-hidden mb-4">
        <div className="h-1.5" style={{background:'linear-gradient(90deg,#142680,#2B35FF)'}} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <Badge label={statusLabels[course.status as CourseStatus]} variant={course.status} />
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/courses/${course.id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                  style={{background:'#eff6ff',color:'#142680',border:'1px solid #bfdbfe'}}>
                  <Edit size={13} /> Edit
                </Link>
                <button onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                  style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold mb-0.5" style={{color:'#10120f'}}>{course.title_en}</h1>
          <p className="text-gray-400 mb-6" dir="rtl">{course.title_ar}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { Icon: MapPin, label: course.city?.name_en, sub: course.venue },
              { Icon: Calendar, label: formatDate(course.day1_date), sub: formatDate(course.day2_date) },
              { Icon: Users, label: 'Trainer', sub: course.trainer_name },
              { Icon: Users, label: 'Capacity', sub: `${course.capacity} trainees` },
            ].map(({Icon, label, sub}, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background:'#f8f9fc'}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:'#eff6ff'}}>
                  <Icon size={15} style={{color:'#142680'}} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          {canEdit && NEXT[course.status] && (
            <div className="mt-5 pt-5" style={{borderTop:'1px solid #f0f4ff'}}>
              <button onClick={() => updateStatus(NEXT[course.status])}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white sol-btn-primary">
                <CheckCircle size={15} /> Move to {statusLabels[NEXT[course.status] as CourseStatus]}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coordinators */}
      <div className="sol-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">Coordinators</h2>
          {canEdit && <button onClick={() => setAssignOpen(!assignOpen)}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{background:'#eff6ff',color:'#142680',border:'1px solid #bfdbfe'}}>
            <UserPlus size={13} /> Assign
          </button>}
        </div>
        {course.course_assignments && course.course_assignments.length > 0 ? (
          <div className="space-y-2">
            {course.course_assignments.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'#f8f9fc'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{background:'linear-gradient(135deg,#142680,#2B35FF)'}}>
                  {a.coordinator.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.coordinator.full_name}</p>
                  <p className="text-xs text-gray-400">{(a.coordinator as any).phone ?? (a.coordinator as any).email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No coordinators assigned yet</p>}
        {assignOpen && (
          <div className="mt-4 pt-4" style={{borderTop:'1px solid #f0f4ff'}}>
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
              {allCoordinators.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={selectedIds.includes(c.id)}
                    onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))}
                    className="rounded" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.full_name}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAssignOpen(false)} className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 transition-all" style={{border:'1px solid #e8edf5'}}>Cancel</button>
              <button onClick={saveAssignments} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Checklist', icon: '✓', href: `/dashboard/checklists?course=${course.id}` },
          { label: 'Attendance', icon: '👥', href: `/dashboard/attendance?course=${course.id}` },
          { label: 'Flags', icon: '⚑', href: `/dashboard/flags?course=${course.id}` },
        ].map(link => (
          <Link key={link.href} href={link.href}
            className="sol-card p-4 text-center group transition-all hover:-translate-y-0.5">
            <div className="text-2xl mb-2">{link.icon}</div>
            <p className="text-sm font-semibold text-gray-700 group-hover:text-[#142680] transition-colors">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
