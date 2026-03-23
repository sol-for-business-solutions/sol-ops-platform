import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  const coordinator_id = searchParams.get('coordinator_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  let query = supabase.from('checkins').select('*, coordinator:profiles!checkins_coordinator_id_fkey(id, full_name, full_name_ar)').eq('course_id', course_id).order('created_at', { ascending: true })
  if (coordinator_id) query = query.eq('coordinator_id', coordinator_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const summary: Record<string, any> = {}
  for (const checkin of data ?? []) {
    const key = `${checkin.coordinator_id}-day${checkin.day}`
    if (!summary[key]) summary[key] = { coordinator_id: checkin.coordinator_id, coordinator: checkin.coordinator, day: checkin.day, checked_in: false, checked_out: false, check_in_time: null, check_out_time: null, is_valid: false, distance_meters: null }
    if (checkin.type === 'in') { summary[key].checked_in = true; summary[key].check_in_time = checkin.created_at; summary[key].is_valid = checkin.is_valid; summary[key].distance_meters = checkin.distance_meters }
    if (checkin.type === 'out') { summary[key].checked_out = true; summary[key].check_out_time = checkin.created_at }
  }
  return NextResponse.json(Object.values(summary))
}
