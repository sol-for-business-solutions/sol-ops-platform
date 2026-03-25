import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/checklist-templates — list all templates
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*')
    .order('course_type')
    .order('phase')
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/admin/checklist-templates — create new template
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'manager'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { course_type, phase, title_en, title_ar, description, requires_photo, order_index } = body

  if (!phase || !title_en || !title_ar)
    return NextResponse.json({ error: 'phase, title_en and title_ar are required' }, { status: 400 })

  if (!['pre', 'during', 'post'].includes(phase))
    return NextResponse.json({ error: 'phase must be pre, during, or post' }, { status: 400 })

  const { data, error } = await supabase
    .from('checklist_templates')
    .insert({
      course_type: course_type || 'standard',
      phase,
      title_en: title_en.trim(),
      title_ar: title_ar.trim(),
      description: description ?? null,
      requires_photo: requires_photo ?? false,
      order_index: order_index ?? 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'CHECKLIST_TEMPLATE_CREATED',
    table_name: 'checklist_templates',
    record_id: data.id,
    new_values: data,
    ip_address: ip,
  })

  return NextResponse.json(data, { status: 201 })
}
