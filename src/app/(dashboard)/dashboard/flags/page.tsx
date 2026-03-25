import { FlagsClient } from '@/components/flags/FlagsClient'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FlagsPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect('/login')

  let query = supabase.from('courses')
    .select('id, title_en, title_ar, status')
    .in('status', ['scheduled', 'in_progress', 'completed'])
    .order('day1_date', { ascending: false })

  if (profile.role === 'coordinator') {
    const { data: assignments } = await supabase.from('course_assignments')
      .select('course_id').eq('coordinator_id', profile.id)
    const ids = (assignments ?? []).map((a: any) => a.course_id)
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return <FlagsClient courses={[]} initialCourseId={null} role={profile.role} userId={profile.id} />
    }
  }

  const { data: courses } = await query

  return (
    <FlagsClient
      courses={courses ?? []}
      initialCourseId={course ?? null}
      role={profile.role}
      userId={profile.id}
    />
  )
}
