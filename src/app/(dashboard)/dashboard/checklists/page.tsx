import { createClient } from '@/lib/supabase/server'
import { ChecklistClient } from '@/components/checklist/ChecklistClient'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ChecklistsPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect('/login')

  let query = supabase.from('courses')
    .select('id, title_en, title_ar, status, day1_date, day2_date')
    .in('status', ['scheduled', 'in_progress'])
    .order('day1_date')

  if (profile.role === 'coordinator') {
    const { data: assignments } = await supabase.from('course_assignments')
      .select('course_id').eq('coordinator_id', profile.id)
    const ids = (assignments ?? []).map((a: any) => a.course_id)
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return <ChecklistClient courses={[]} initialCourseId={null} role={profile.role} />
    }
  }

  const { data: courses } = await query
  const courseList = courses ?? []
  const initialId = course ?? courseList[0]?.id ?? null

  return <ChecklistClient courses={courseList} initialCourseId={initialId} role={profile.role} />
}
