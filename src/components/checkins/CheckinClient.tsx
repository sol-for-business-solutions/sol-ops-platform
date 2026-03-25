'use client'
import { useState, useEffect } from 'react'
import { MapPin, CheckCircle2, XCircle, Clock, Navigation, Map, List } from 'lucide-react'
import { useCheckin } from '@/hooks/useCheckin'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Profile } from '@/types'

interface Course { id: string; title_en: string; title_ar: string; status: string; day1_date: string; day2_date: string; venue: string; city: { id: string; name_en: string; lat: number; lng: number } }
interface Props { courses: Course[]; initialCourseId: string | null; profile: Profile; role: string }

// Dynamically loaded map to avoid SSR issues
function LazyMapView({ courseId, venue }: { courseId: string; venue: { lat: number; lng: number; name: string } }) {
  const [MapComp, setMapComp] = useState<React.ComponentType<any> | null>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('./CheckinMap').then(m => setMapComp(() => m.CheckinMap))
    fetch(`/api/checkins?course_id=${courseId}`)
      .then(r => r.json())
      .then(data => { setCheckins(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId])

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!MapComp) return <div className="flex justify-center py-16"><Spinner /></div>
  return <MapComp checkins={checkins} venue={venue} />
}

export function CheckinClient({ courses, initialCourseId, profile, role }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId ?? courses[0]?.id ?? '')
  const [lastResult, setLastResult] = useState<any>(null)
  const [activeDay, setActiveDay] = useState<1 | 2>(1)
  const [activeTab, setActiveTab] = useState<'checkin' | 'map'>('checkin')
  const { loading, submitting, gpsError, gpsLoading, getStatus, checkIn } = useCheckin(selectedCourseId, profile.id)
  const selectedCourse = courses.find(c => c.id === selectedCourseId)
  const isCoordinator = role === 'coordinator'
  async function handleCheckIn(day: 1 | 2, type: 'in' | 'out') { const result = await checkIn(day, type); if (result) setLastResult(result) }
  function formatTime(dateStr: string) { return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }
  const today = new Date().toISOString().split('T')[0]
  function getDayStatus(course: Course, day: 1 | 2) {
    const dateStr = day === 1 ? course.day1_date : course.day2_date
    if (dateStr === today) return 'today'; if (dateStr < today) return 'past'; return 'upcoming'
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Check-in / Check-out</h1>
          <p className="text-sm text-gray-500 mt-0.5">GPS-verified presence at course venue</p>
        </div>
        {selectedCourse && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setActiveTab('checkin')} className={`flex items-center gap-1.5 px-3 py-2 text-sm ${activeTab === 'checkin' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <List size={14} />Check-in
            </button>
            <button onClick={() => setActiveTab('map')} className={`flex items-center gap-1.5 px-3 py-2 text-sm border-l border-gray-200 ${activeTab === 'map' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Map size={14} />Map view
            </button>
          </div>
        )}
      </div>
      {courses.length === 0 ? <EmptyState title="No active courses" description="Check-in is available for scheduled and in-progress courses" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Select course</p>
            <div className="space-y-1.5">
              {courses.map(course => (
                <button key={course.id} onClick={() => { setSelectedCourseId(course.id); setLastResult(null); setActiveTab('checkin') }}
                  className={`w-full text-left px-3 py-3 rounded-lg border text-sm transition-all ${selectedCourseId === course.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
                  <p className="font-medium line-clamp-1">{course.title_en}</p>
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${selectedCourseId === course.id ? 'text-gray-300' : 'text-gray-400'}`}><MapPin size={10} />{course.city.name_en} · {course.venue}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {!selectedCourse ? <EmptyState title="Select a course to check in" /> : (
              <>
                {activeTab === 'map' ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <LazyMapView
                      courseId={selectedCourse.id}
                      venue={{ lat: selectedCourse.city.lat, lng: selectedCourse.city.lng, name: selectedCourse.venue }}
                    />
                  </div>
                ) : loading ? <div className="flex justify-center py-16"><Spinner /></div> : (
                  <>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><MapPin size={18} className="text-gray-600" /></div>
                        <div><p className="font-medium text-gray-900">{selectedCourse.venue}</p><p className="text-sm text-gray-500">{selectedCourse.city.name_en}</p><p className="text-xs text-gray-400 mt-1">GPS validation radius: 500 meters</p></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {([1, 2] as const).map(day => {
                        const dateStr = day === 1 ? selectedCourse.day1_date : selectedCourse.day2_date
                        const dayStatus = getDayStatus(selectedCourse, day)
                        const checkinStatus = getStatus(day)
                        return (
                          <button key={day} onClick={() => setActiveDay(day)} className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${activeDay === day ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
                            <p>Day {day}</p>
                            <p className={`text-xs font-normal mt-0.5 ${activeDay === day ? 'text-gray-300' : 'text-gray-400'}`}>{formatDate(dateStr)}{dayStatus === 'today' && <span className="ml-1 text-green-400">· Today</span>}</p>
                            {checkinStatus && <p className={`text-xs mt-1 ${activeDay === day ? 'text-green-300' : 'text-green-600'}`}>{(checkinStatus as any).checked_in ? `✓ Checked in${(checkinStatus as any).checked_out ? ' & out' : ''}` : 'Not checked in'}</p>}
                          </button>
                        )
                      })}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {(['in', 'out'] as const).map(type => {
                          const status = getStatus(activeDay)
                          const done = type === 'in' ? (status as any)?.checked_in : (status as any)?.checked_out
                          const time = type === 'in' ? (status as any)?.check_in_time : (status as any)?.check_out_time
                          const valid = (status as any)?.is_valid
                          const distance = (status as any)?.distance_meters
                          return (
                            <div key={type} className={`rounded-xl p-4 border-2 ${done ? (valid !== false ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50') : 'border-gray-100 bg-gray-50'}`}>
                              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${done ? (valid !== false ? 'text-green-700' : 'text-amber-700') : 'text-gray-400'}`}>{type === 'in' ? 'Check-in' : 'Check-out'}</p>
                              {done ? (<><div className="flex items-center gap-1.5"><CheckCircle2 size={18} className={valid !== false ? 'text-green-500' : 'text-amber-500'} /><span className={`text-lg font-semibold ${valid !== false ? 'text-green-800' : 'text-amber-800'}`}>{formatTime(time)}</span></div>{distance !== undefined && <p className={`text-xs mt-1 ${valid !== false ? 'text-green-600' : 'text-amber-600'}`}>{distance}m from venue</p>}</>) : (<div className="flex items-center gap-1.5"><Clock size={18} className="text-gray-300" /><span className="text-gray-400 text-sm">Not yet</span></div>)}
                            </div>
                          )
                        })}
                      </div>
                      {gpsError && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2"><XCircle size={16} className="shrink-0 mt-0.5" />{gpsError}</div>}
                      {lastResult && !gpsError && (
                        <div className={`mb-4 rounded-lg p-3 text-sm flex items-start gap-2 ${lastResult.is_valid ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                          {lastResult.is_valid ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
                          <div><p className="font-medium">{lastResult.is_valid ? 'Check-in verified successfully' : 'Location outside venue radius'}</p><p className="text-xs mt-0.5 opacity-80">Distance from venue: {lastResult.distance_meters}m{!lastResult.is_valid && ' — A warning flag has been raised automatically'}</p></div>
                        </div>
                      )}
                      {isCoordinator && (
                        <div className="space-y-3">
                          {(() => {
                            const dateStr = activeDay === 1 ? selectedCourse.day1_date : selectedCourse.day2_date
                            const isToday = dateStr === today; const isPast = dateStr < today
                            const status = getStatus(activeDay)
                            const checkedIn = (status as any)?.checked_in ?? false
                            const checkedOut = (status as any)?.checked_out ?? false
                            if (!isToday && !isPast) return <p className="text-sm text-gray-400 text-center py-4">Check-in opens on {formatDate(dateStr)}</p>
                            if (checkedIn && checkedOut) return <div className="flex items-center justify-center gap-2 py-4 text-green-600"><CheckCircle2 size={20} /><span className="text-sm font-medium">Day {activeDay} complete — checked in and out</span></div>
                            return (
                              <>
                                {!checkedIn && <button onClick={() => handleCheckIn(activeDay, 'in')} disabled={submitting || gpsLoading} className="w-full flex items-center justify-center gap-2.5 bg-gray-900 text-white py-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">{gpsLoading ? <><Spinner size="sm" />Getting your location...</> : submitting ? <><Spinner size="sm" />Recording check-in...</> : <><Navigation size={18} />Check in for Day {activeDay}</>}</button>}
                                {checkedIn && !checkedOut && <button onClick={() => handleCheckIn(activeDay, 'out')} disabled={submitting || gpsLoading} className="w-full flex items-center justify-center gap-2.5 border-2 border-gray-900 text-gray-900 py-4 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">{gpsLoading ? <><Spinner size="sm" />Getting your location...</> : submitting ? <><Spinner size="sm" />Recording check-out...</> : <><Navigation size={18} />Check out for Day {activeDay}</>}</button>}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
