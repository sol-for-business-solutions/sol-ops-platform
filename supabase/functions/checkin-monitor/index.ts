import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00Z`
  const now = new Date()
  const nowHour = now.getUTCHours() + (parseInt(Deno.env.get('TZ_OFFSET') ?? '3')) // KSA = UTC+3
  const nowMin = now.getUTCMinutes()
  const minutesSinceMidnight = nowHour * 60 + nowMin

  // Course starts at 8:00 AM KSA
  const courseStartMinutes = 8 * 60          // 480
  const lateThreshold = courseStartMinutes + 30  // FR-404: Warning after 30 min = 8:30 AM
  const noShowThreshold = courseStartMinutes + 60 // FR-405: Critical after 60 min = 9:00 AM

  // Only run between 8:30 AM and 11:00 AM KSA to avoid unnecessary processing
  if (minutesSinceMidnight < lateThreshold || minutesSinceMidnight > 660) {
    return new Response(JSON.stringify({ skipped: true, reason: 'Outside monitoring window' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: courses } = await supabase.from('courses')
    .select('id, title_en, day1_date, day2_date')
    .eq('status', 'in_progress')

  if (!courses || courses.length === 0) {
    return new Response(JSON.stringify({ checked: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  const activeCourses = courses.filter(c => c.day1_date === today || c.day2_date === today)
  let warningFlagsRaised = 0
  let criticalFlagsRaised = 0

  for (const course of activeCourses) {
    const courseDay = course.day1_date === today ? 1 : 2
    const { data: assignments } = await supabase.from('course_assignments')
      .select('coordinator_id')
      .eq('course_id', course.id)
    if (!assignments || assignments.length === 0) continue

    for (const assignment of assignments) {
      // Check if coordinator already checked in
      const { data: existingCheckin } = await supabase.from('checkins')
        .select('id')
        .eq('course_id', course.id)
        .eq('coordinator_id', assignment.coordinator_id)
        .eq('day', courseDay)
        .eq('type', 'in')
        .maybeSingle()

      if (existingCheckin) continue // Already checked in, skip

      // Check if a flag was already raised today for this coordinator+course
      const { data: existingFlag } = await supabase.from('flags')
        .select('id, severity')
        .eq('course_id', course.id)
        .eq('raised_by', assignment.coordinator_id)
        .eq('category', 'venue_issue')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (minutesSinceMidnight >= noShowThreshold) {
        // FR-405: No-show → Critical (if no critical/emergency flag yet)
        if (!existingFlag || existingFlag.severity === 'warning') {
          if (existingFlag?.severity === 'warning') {
            // Escalate the existing warning to critical
            await supabase.from('flags').update({
              severity: 'critical',
              escalated_from: 'warning',
              escalated_at: now.toISOString(),
              description: `Coordinator has not checked in for Day ${courseDay} — no GPS record after 9:00 AM. Course: ${course.title_en}`,
            }).eq('id', existingFlag.id)
          } else if (!existingFlag) {
            // No flag yet — raise critical directly (edge case: monitor skipped earlier)
            await supabase.from('flags').insert({
              course_id: course.id,
              raised_by: assignment.coordinator_id,
              severity: 'critical',
              category: 'venue_issue',
              description: `No-show: Coordinator has not checked in for Day ${courseDay} — no GPS record after 9:00 AM. Course: ${course.title_en}`,
              status: 'open',
            })
            criticalFlagsRaised++
          }
        }
      } else if (minutesSinceMidnight >= lateThreshold && !existingFlag) {
        // FR-404: Late check-in → Warning at 8:30 AM
        await supabase.from('flags').insert({
          course_id: course.id,
          raised_by: assignment.coordinator_id,
          severity: 'warning',
          category: 'venue_issue',
          description: `Late check-in: Coordinator has not checked in for Day ${courseDay} — expected by 8:00 AM, threshold exceeded at 8:30 AM. Course: ${course.title_en}`,
          status: 'open',
        })
        warningFlagsRaised++
      }
    }
  }

  return new Response(
    JSON.stringify({ activeCourses: activeCourses.length, warningFlagsRaised, criticalFlagsRaised }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
