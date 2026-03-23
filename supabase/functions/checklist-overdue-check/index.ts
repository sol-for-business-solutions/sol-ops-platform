import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const today = new Date().toISOString().split('T')[0]
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Find courses that completed day 2 more than 24 hours ago with incomplete post-checklist items
  const { data: completingCourses } = await supabase.from('courses')
    .select('id, title_en, created_by').eq('status', 'in_progress').lt('day2_date', today)

  if (!completingCourses || completingCourses.length === 0) return new Response(JSON.stringify({ checked: 0 }))

  let flagsRaised = 0
  for (const course of completingCourses) {
    const { data: postItems } = await supabase.from('checklist_items').select('id, is_completed').eq('course_id', course.id).eq('phase', 'post')
    if (!postItems || postItems.length === 0) continue
    const incomplete = postItems.filter(i => !i.is_completed)
    if (incomplete.length > 0) {
      const { data: existingFlag } = await supabase.from('flags').select('id').eq('course_id', course.id).eq('category', 'other').ilike('description', '%post-course checklist%').single()
      if (!existingFlag) {
        await supabase.from('flags').insert({ course_id: course.id, raised_by: course.created_by, severity: 'warning', category: 'other', description: `Post-course checklist is incomplete: ${incomplete.length} task${incomplete.length > 1 ? 's' : ''} still pending after course end date.`, status: 'open' })
        flagsRaised++
      }
    }
  }

  return new Response(JSON.stringify({ checked: completingCourses.length, flagsRaised }), { headers: { 'Content-Type': 'application/json' } })
})
