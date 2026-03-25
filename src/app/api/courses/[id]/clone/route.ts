import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: source } = await supabase.from('courses').select('*').eq('id', id).single()
  if (!source) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Default dates: 7 days from now
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const day1 = nextWeek.toISOString().split('T')[0]
  const day2Date = new Date(nextWeek)
  day2Date.setDate(day2Date.getDate() + 1)
  const day2 = day2Date.toISOString().split('T')[0]

  const { data: clone, error: cloneError } = await supabase
    .from('courses')
    .insert({
      title_en: `${source.title_en} (Copy)`,
      title_ar: `${source.title_ar} (نسخة)`,
      city_id: source.city_id,
      venue: source.venue,
      day1_date: day1,
      day2_date: day2,
      trainer_name: source.trainer_name,
      capacity: source.capacity,
      course_type: source.course_type,
      status: 'draft',
      created_by: user.id,
    })
    .select('*, city:cities(*)')
    .single()

  if (cloneError) return NextResponse.json({ error: cloneError.message }, { status: 500 })

  // Clone checklist items
  const { data: sourceItems } = await supabase.from('checklist_items').select('*').eq('course_id', id)
  if (sourceItems && sourceItems.length > 0 && clone) {
    await supabase.from('checklist_items').insert(
      sourceItems.map(item => ({
        course_id: clone.id,
        template_id: item.template_id,
        phase: item.phase,
        title_en: item.title_en,
        title_ar: item.title_ar,
        description: item.description,
        requires_photo: item.requires_photo,
        order_index: item.order_index,
      }))
    )
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'COURSE_CLONED',
    table_name: 'courses',
    record_id: clone?.id,
    new_values: { cloned_from: id, title_en: clone?.title_en },
    ip_address: ip,
  })

  return NextResponse.json(clone, { status: 201 })
}
