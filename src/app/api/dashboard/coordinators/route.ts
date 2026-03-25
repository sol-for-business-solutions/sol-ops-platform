import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: coordinators } = await supabase
    .from('profiles')
    .select('id, full_name, full_name_ar, email, phone')
    .eq('role', 'coordinator')
    .eq('is_active', true)
    .order('full_name')
  if (!coordinators) return NextResponse.json([])

  const results = await Promise.all(coordinators.map(async coord => {
    // Course assignments
    const { data: assignments } = await supabase
      .from('course_assignments').select('course_id').eq('coordinator_id', coord.id)
    const courseIds = assignments?.map(a => a.course_id) ?? []

    // Checklist completion rate
    const { data: items } = courseIds.length > 0
      ? await supabase.from('checklist_items').select('is_completed').in('course_id', courseIds)
      : { data: [] }
    const checklistRate = items && items.length > 0
      ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100) : null

    // Flags raised
    const { count: flagsRaised } = await supabase
      .from('flags').select('id', { count: 'exact', head: true }).eq('raised_by', coord.id)

    // FR-703: Average check-in time (minutes after midnight)
    const { data: checkins } = await supabase
      .from('checkins')
      .select('created_at, day, course_id')
      .eq('coordinator_id', coord.id)
      .eq('type', 'in')
      .order('created_at', { ascending: false })
      .limit(20)

    let avgCheckinMinutes: number | null = null
    if (checkins && checkins.length > 0) {
      const minutesList = checkins.map(c => {
        const d = new Date(c.created_at)
        return d.getHours() * 60 + d.getMinutes()
      })
      avgCheckinMinutes = Math.round(minutesList.reduce((a, b) => a + b, 0) / minutesList.length)
    }

    // Format avg check-in as HH:MM
    let avgCheckinTime: string | null = null
    if (avgCheckinMinutes !== null) {
      const h = Math.floor(avgCheckinMinutes / 60)
      const m = avgCheckinMinutes % 60
      avgCheckinTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    // On-time rate: check-ins before 8:30 AM
    let onTimeRate: number | null = null
    if (checkins && checkins.length > 0) {
      const onTime = checkins.filter(c => {
        const d = new Date(c.created_at)
        return d.getHours() * 60 + d.getMinutes() <= 8 * 60 + 30
      }).length
      onTimeRate = Math.round((onTime / checkins.length) * 100)
    }

    return {
      ...coord,
      totalAssigned: courseIds.length,
      checklistRate,
      flagsRaised: flagsRaised ?? 0,
      avgCheckinTime,
      onTimeRate,
      totalCheckins: checkins?.length ?? 0,
    }
  }))

  return NextResponse.json(results)
}
