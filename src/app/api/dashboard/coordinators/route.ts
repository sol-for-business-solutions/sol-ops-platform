import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: coordinators } = await supabase.from('profiles').select('id, full_name, full_name_ar, email').eq('role', 'coordinator').eq('is_active', true).order('full_name')
  if (!coordinators) return NextResponse.json([])
  const results = await Promise.all(coordinators.map(async coord => {
    const { data: assignments } = await supabase.from('course_assignments').select('course_id').eq('coordinator_id', coord.id)
    const courseIds = assignments?.map(a => a.course_id) ?? []
    const { data: items } = courseIds.length > 0 ? await supabase.from('checklist_items').select('is_completed').in('course_id', courseIds) : { data: [] }
    const checklistRate = items && items.length > 0 ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100) : null
    const { count: flagsRaised } = await supabase.from('flags').select('id', { count: 'exact', head: true }).eq('raised_by', coord.id)
    return { ...coord, totalAssigned: courseIds.length, checklistRate, flagsRaised: flagsRaised ?? 0 }
  }))
  return NextResponse.json(results)
}
