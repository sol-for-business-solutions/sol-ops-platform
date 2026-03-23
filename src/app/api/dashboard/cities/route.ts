import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: cities } = await supabase.from('cities').select('id, name_en, name_ar, region_en').order('region_en')
  if (!cities) return NextResponse.json([])
  const results = await Promise.all(cities.map(async city => {
    const { data: courses } = await supabase.from('courses').select('id, status').eq('city_id', city.id)
    const courseIds = courses?.map(c => c.id) ?? []
    let openFlags = 0; let trainees = 0
    if (courseIds.length > 0) {
      const { count: fc } = await supabase.from('flags').select('id', { count: 'exact', head: true }).in('course_id', courseIds).neq('status', 'resolved')
      const { count: tc } = await supabase.from('trainees').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
      openFlags = fc ?? 0; trainees = tc ?? 0
    }
    return { ...city, total: courses?.length ?? 0, active: courses?.filter(c => c.status === 'in_progress').length ?? 0, scheduled: courses?.filter(c => c.status === 'scheduled').length ?? 0, completed: courses?.filter(c => c.status === 'completed').length ?? 0, openFlags, trainees }
  }))
  return NextResponse.json(results)
}
