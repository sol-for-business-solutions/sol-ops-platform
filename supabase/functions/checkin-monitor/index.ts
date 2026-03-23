import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00Z`

  // Get all in-progress courses happening today
  const { data: courses } = await supabase.from('courses').select('id, title_en, day1_date, day2_date').eq('status', 'in_progress')
  if (!courses || courses.length === 0) return new Response(JSON.stringify({ checked: 0 }))

  const activeCourses = courses.filter(c => c.day1_date === today || c.day2_date === today)
  let flagsRaised = 0
  const now = new Date()
  const courseStartHour = 8 // 8 AM
  const gracePeriodMinutes = 30

  for (const course of activeCourses) {
    const courseDay = course.day1_date === today ? 1 : 2
    const { data: assignments } = await supabase.from('course_assignments').select('coordinator_id').eq('course_id', course.id)
    if (!assignments || assignments.length === 0) continue

    for (const assignment of assignments) {
      const { data: existingCheckin } = await supabase.from('checkins').select('id').eq('course_id', course.id).eq('coordinator_id', assignment.coordinator_id).eq('day', courseDay).eq('type', 'in').single()
      if (existingCheckin) continue

      if (now.getHours() >= courseStartHour && (now.getHours() - courseStartHour) * 60 + now.getMinutes() > gracePeriodMinutes) {
        const { data: existingFlag } = await supabase.from('flags').select('id').eq('course_id', course.id).eq('raised_by', assignment.coordinator_id).eq('category', 'venue_issue').gte('created_at', todayStart).single()
        if (!existingFlag) {
          await supabase.from('flags').insert({ course_id: course.id, raised_by: assignment.coordinator_id, severity: 'critical', category: 'venue_issue', description: `Coordinator has not checked in for Day ${courseDay} — no GPS verification recorded after ${courseStartHour + Math.floor(gracePeriodMinutes / 60)}:${String(gracePeriodMinutes % 60).padStart(2, '0')} AM.`, status: 'open' })
          flagsRaised++
        }
      }
    }
  }

  return new Response(JSON.stringify({ activeCourses: activeCourses.length, flagsRaised }), { headers: { 'Content-Type': 'application/json' } })
})
