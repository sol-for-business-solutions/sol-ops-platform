'use client'
import { useState } from 'react'
import { CourseReport } from './CourseReport'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarChart2 } from 'lucide-react'

interface Course { id: string; title_en: string; status: string; day1_date: string; city: { name_en: string } }

export function ReportsClient({ courses }: { courses: Course[] }) {
  const [selectedId, setSelectedId] = useState(courses[0]?.id ?? '')
  function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  return (
    <div>
      <div className="flex items-center gap-3 mb-6"><div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center"><BarChart2 size={16} className="text-white" /></div><div><h1 className="text-xl font-semibold text-gray-900">Reports</h1><p className="text-sm text-gray-400">Course performance, attendance & flags</p></div></div>
      {courses.length === 0 ? <EmptyState title="No completed courses yet" description="Reports are available for in-progress and completed courses" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Select course</p>
            <div className="space-y-1.5">
              {courses.map(c => (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg border text-sm transition-all ${selectedId === c.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
                  <p className="font-medium line-clamp-1">{c.title_en}</p>
                  <p className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-gray-300' : 'text-gray-400'}`}>{c.city?.name_en} · {formatDate(c.day1_date)}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            {selectedId ? <CourseReport courseId={selectedId} /> : <EmptyState title="Select a course" />}
          </div>
        </div>
      )}
    </div>
  )
}
