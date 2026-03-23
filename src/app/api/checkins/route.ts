import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Haversine distance in meters between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  let query = supabase
    .from('checkins')
    .select('*, coordinator:profiles!checkins_coordinator_id_fkey(id, full_name, full_name_ar, phone)')
    .order('created_at', { ascending: false })
  if (course_id) query = query.eq('course_id', course_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id, day, type, lat, lng } = await request.json()
  if (!course_id || !day || !type || lat === undefined || lng === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check coordinator is assigned to this course
  const { data: assignment } = await supabase
    .from('course_assignments')
    .select('id')
    .eq('course_id', course_id)
    .eq('coordinator_id', user.id)
    .single()

  // Allow managers and admins to bypass assignment check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isManager = ['super_admin', 'manager'].includes(profile?.role ?? '')

  if (!assignment && !isManager) {
    return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 })
  }

  // Get course city location
  const { data: course } = await supabase
    .from('courses')
    .select('id, title_en, city:cities(lat, lng, name_en)')
    .eq('id', course_id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const cityLat = (course.city as any)?.lat ?? lat
  const cityLng = (course.city as any)?.lng ?? lng
  const distance = Math.round(haversineDistance(lat, lng, cityLat, cityLng))
  const isValid = distance <= 500

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      course_id,
      coordinator_id: user.id,
      day,
      type,
      lat,
      lng,
      is_valid: isValid,
      distance_meters: distance,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Already checked ${type} for Day ${day}` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-flag if location is invalid
  if (!isValid) {
    await supabase.from('flags').insert({
      course_id,
      raised_by: user.id,
      severity: 'warning',
      category: 'venue_issue',
      description: `GPS check-in location is ${distance}m from venue (maximum allowed: 500m). Please verify coordinator is on-site.`,
      status: 'open',
    })
  }

  return NextResponse.json({ ...checkin, is_valid: isValid, distance_meters: distance }, { status: 201 })
}
