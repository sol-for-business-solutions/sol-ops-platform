import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const city_id = searchParams.get('city_id')
  const search = searchParams.get('search')
  let query = supabase
    .from('courses')
    .select('*, city:cities(id, name_en, name_ar, region_en), course_assignments(id, coordinator:profiles!course_assignments_coordinator_id_fkey(id, full_name, full_name_ar, phone))')
    .order('day1_date', { ascending: false })
  if (status) query = query.eq('status', status)
  if (city_id) query = query.eq('city_id', city_id)
  if (search) query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const body = await request.json()

  // FR-101: Venue/date conflict validation
  if (body.city_id && body.day1_date) {
    const { data: conflicts } = await supabase
      .from('courses')
      .select('id, title_en, day1_date, day2_date')
      .eq('city_id', body.city_id)
      .neq('status', 'archived')
      .or(
        `day1_date.eq.${body.day1_date},day2_date.eq.${body.day1_date},day1_date.eq.${body.day2_date},day2_date.eq.${body.day2_date}`
      )

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: `Scheduling conflict: "${conflicts[0].title_en}" is already scheduled in this city on overlapping dates (${conflicts[0].day1_date} – ${conflicts[0].day2_date}). Please choose different dates.`,
        conflict: conflicts[0],
      }, { status: 409 })
    }
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({ ...body, created_by: user.id, status: 'draft' })
    .select('*, city:cities(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create checklist items from templates
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('course_type', body.course_type || 'standard')
    .eq('is_active', true)

  if (templates && templates.length > 0) {
    await supabase.from('checklist_items').insert(
      templates.map(t => ({
        course_id: data.id,
        template_id: t.id,
        phase: t.phase,
        title_en: t.title_en,
        title_ar: t.title_ar,
        description: t.description,
        requires_photo: t.requires_photo,
        order_index: t.order_index,
      }))
    )
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'COURSE_CREATED',
    table_name: 'courses',
    record_id: data.id,
    new_values: data,
    ip_address: ip,
  })

  return NextResponse.json(data, { status: 201 })
}
