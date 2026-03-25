import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/courses/bulk
// Body: { courses: Array<{ title_en, title_ar, city_name, venue, day1_date, trainer_name, capacity?, course_type? }> }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Only admins and managers can bulk-import courses' }, { status: 403 })
  }

  const { courses } = await request.json()
  if (!Array.isArray(courses) || courses.length === 0) {
    return NextResponse.json({ error: 'courses array is required' }, { status: 400 })
  }

  // Load cities for matching by name
  const { data: cities } = await supabase.from('cities').select('id, name_en, name_ar')
  const cityMap = new Map<string, string>()
  cities?.forEach(c => {
    cityMap.set(c.name_en.toLowerCase(), c.id)
    cityMap.set(c.name_ar, c.id)
  })

  const { data: templates } = await supabase.from('checklist_templates')
    .select('*').eq('course_type', 'standard').eq('is_active', true)

  const errors: { row: number; error: string }[] = []
  const created: any[] = []

  for (let i = 0; i < courses.length; i++) {
    const row = courses[i]
    const rowNum = i + 1

    if (!row.title_en) { errors.push({ row: rowNum, error: 'title_en is required' }); continue }
    if (!row.title_ar) { errors.push({ row: rowNum, error: 'title_ar is required' }); continue }
    if (!row.venue) { errors.push({ row: rowNum, error: 'venue is required' }); continue }
    if (!row.day1_date) { errors.push({ row: rowNum, error: 'day1_date is required (YYYY-MM-DD)' }); continue }
    if (!row.trainer_name) { errors.push({ row: rowNum, error: 'trainer_name is required' }); continue }

    const cityId = cityMap.get((row.city_name ?? '').toLowerCase()) ?? cityMap.get(row.city_name ?? '')
    if (!cityId) { errors.push({ row: rowNum, error: `City "${row.city_name}" not found` }); continue }

    // Calculate day2 as day1 + 1
    const d1 = new Date(row.day1_date)
    if (isNaN(d1.getTime())) { errors.push({ row: rowNum, error: 'Invalid day1_date format (use YYYY-MM-DD)' }); continue }
    const d2 = new Date(d1); d2.setDate(d2.getDate() + 1)
    const day2_date = d2.toISOString().split('T')[0]

    const { data: course, error: insertErr } = await supabase.from('courses').insert({
      title_en: row.title_en.trim(),
      title_ar: row.title_ar.trim(),
      city_id: cityId,
      venue: row.venue.trim(),
      day1_date: row.day1_date,
      day2_date,
      trainer_name: row.trainer_name.trim(),
      capacity: Number(row.capacity) || 30,
      course_type: row.course_type || 'standard',
      status: 'draft',
      created_by: user.id,
    }).select('*, city:cities(id, name_en, name_ar)').single()

    if (insertErr) { errors.push({ row: rowNum, error: insertErr.message }); continue }

    // Clone checklist templates
    if (templates && templates.length > 0 && course) {
      await supabase.from('checklist_items').insert(
        templates.map(t => ({
          course_id: course.id, template_id: t.id, phase: t.phase,
          title_en: t.title_en, title_ar: t.title_ar,
          description: t.description, requires_photo: t.requires_photo,
          order_index: t.order_index,
        }))
      )
    }

    if (course) created.push(course)
  }

  await supabase.from('audit_log').insert({
    user_id: user.id, action: 'BULK_COURSES_IMPORTED',
    table_name: 'courses',
    new_values: { created: created.length, errors: errors.length, total: courses.length },
  })

  return NextResponse.json({ created: created.length, errors, courses: created }, { status: 201 })
}
