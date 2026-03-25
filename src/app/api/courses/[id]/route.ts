import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*, city:cities(*), course_assignments(id, coordinator:profiles!course_assignments_coordinator_id_fkey(id, full_name, full_name_ar, phone, email))')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const body = await request.json()

  // FR-101: Conflict check on date/city update
  if ((body.city_id || body.day1_date) && body.day1_date) {
    const { data: current } = await supabase.from('courses').select('city_id').eq('id', id).single()
    const cityId = body.city_id ?? current?.city_id
    if (cityId) {
      const { data: conflicts } = await supabase
        .from('courses')
        .select('id, title_en, day1_date, day2_date')
        .eq('city_id', cityId)
        .neq('status', 'archived')
        .neq('id', id)
        .or(
          `day1_date.eq.${body.day1_date},day2_date.eq.${body.day1_date},day1_date.eq.${body.day2_date},day2_date.eq.${body.day2_date}`
        )
      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({
          error: `Scheduling conflict: "${conflicts[0].title_en}" is already scheduled in this city on overlapping dates.`,
          conflict: conflicts[0],
        }, { status: 409 })
      }
    }
  }

  const { data: old } = await supabase.from('courses').select('*').eq('id', id).single()
  const { data, error } = await supabase
    .from('courses')
    .update({ ...body, updated_by: user.id })
    .eq('id', id)
    .select('*, city:cities(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'COURSE_UPDATED',
    table_name: 'courses',
    record_id: id,
    old_values: old,
    new_values: data,
    ip_address: ip,
  })

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'COURSE_DELETED',
    table_name: 'courses',
    record_id: id,
    ip_address: ip,
  })

  return NextResponse.json({ success: true })
}
