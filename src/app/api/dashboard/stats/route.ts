import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const city_id = searchParams.get('city_id')
  let courseQuery = supabase.from('courses').select('id, status, city_id')
  if (city_id) courseQuery = courseQuery.eq('city_id', city_id)
  const { data: courses } = await courseQuery
  const activeCourseIds = courses?.filter(c => c.status === 'in_progress').map(c => c.id) ?? []
  const scheduledCourseIds = courses?.filter(c => c.status === 'scheduled').map(c => c.id) ?? []
  let openFlags: any[] = []
  const allActiveIds = [...activeCourseIds, ...scheduledCourseIds]
  if (allActiveIds.length > 0) {
    const { data } = await supabase.from('flags').select('id, severity, status, course_id').neq('status', 'resolved').in('course_id', allActiveIds)
    openFlags = data ?? []
  } else if (!city_id) {
    const { data } = await supabase.from('flags').select('id, severity, status, course_id').neq('status', 'resolved')
    openFlags = data ?? []
  }
  let checklistStats = { total: 0, completed: 0 }
  if (activeCourseIds.length > 0) {
    const { data: items } = await supabase.from('checklist_items').select('is_completed').in('course_id', activeCourseIds)
    checklistStats = { total: items?.length ?? 0, completed: items?.filter(i => i.is_completed).length ?? 0 }
  }
  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckins } = await supabase.from('checkins').select('coordinator_id, type').gte('created_at', `${today}T00:00:00Z`).eq('type', 'in')
  let assignedCount = 0
  if (activeCourseIds.length > 0) {
    const { data: assignments } = await supabase.from('course_assignments').select('coordinator_id').in('course_id', activeCourseIds)
    assignedCount = new Set(assignments?.map(a => a.coordinator_id) ?? []).size
  }
  const { count: certCount } = await supabase.from('certificates').select('id', { count: 'exact', head: true })
  const checklistPct = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0
  return NextResponse.json({
    activeCourses: activeCourseIds.length,
    scheduledCourses: scheduledCourseIds.length,
    totalCourses: courses?.length ?? 0,
    openFlags: openFlags.length,
    flagsBySeverity: { info: openFlags.filter(f => f.severity === 'info').length, warning: openFlags.filter(f => f.severity === 'warning').length, critical: openFlags.filter(f => f.severity === 'critical').length, emergency: openFlags.filter(f => f.severity === 'emergency').length },
    checklistPct, checklistStats,
    assignedCoordinators: assignedCount,
    checkedInToday: new Set(todayCheckins?.map(c => c.coordinator_id) ?? []).size,
    certificatesIssued: certCount ?? 0,
  })
}
