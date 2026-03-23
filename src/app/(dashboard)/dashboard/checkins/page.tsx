import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { CheckinClient } from '@/components/checkins/CheckinClient'
import { redirect } from 'next/navigation'

export default async function CheckinsPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect('/login')

  let query = supabase.from('courses')
    .select('id, title_en, title_ar, status, day1_date, day2_date, venue, city:cities(id, name_en, lat, lng)')
    .in('status', ['scheduled', 'in_progress'])
    .order('day1_date')

  if (profile.role === 'coordinator') {
    const { data: assignments } = await supabase.from('course_assignments')
      .select('course_id').eq('coordinator_id', profile.id)
    const ids = (assignments ?? []).map((a: any) => a.course_id)
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return <CheckinClient courses={[]} initialCourseId={null} profile={profile} role={profile.role} />
    }
  }

  const { data: courses } = await query
  const courseList = (courses ?? []) as any[]
  const initialId = course ?? courseList[0]?.id ?? null

  return <CheckinClient courses={courseList} initialCourseId={initialId} profile={profile} role={profile.role} />
}
