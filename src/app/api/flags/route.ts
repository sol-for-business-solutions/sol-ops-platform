import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  let query = supabase.from('flags').select('*, course:courses(id, title_en, title_ar, city:cities(name_en)), raised_by_profile:profiles!flags_raised_by_fkey(id, full_name, full_name_ar), acknowledged_by_profile:profiles!flags_acknowledged_by_fkey(id, full_name), resolved_by_profile:profiles!flags_resolved_by_fkey(id, full_name)').order('created_at', { ascending: false }).limit(50)
  const course_id = searchParams.get('course_id')
  const severity = searchParams.get('severity')
  const status = searchParams.get('status')
  if (course_id) query = query.eq('course_id', course_id)
  if (severity) query = query.eq('severity', severity)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { course_id, severity, category, description, photo_url } = body
  if (!course_id || !severity || !category || !description) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const { data, error } = await supabase.from('flags').insert({ course_id, raised_by: user.id, severity, category, description, photo_url: photo_url ?? null, status: 'open' }).select('*, course:courses(id, title_en, city:cities(name_en)), raised_by_profile:profiles!flags_raised_by_fkey(id, full_name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (['critical', 'emergency'].includes(severity)) {
    const { data: managers } = await supabase.from('profiles').select('id, full_name, phone, email').in('role', ['super_admin', 'manager']).eq('is_active', true)
    if (managers && managers.length > 0) {
      const message = `${severity.toUpperCase()} flag raised: ${description} — Course: ${data.course?.title_en ?? ''} (${data.course?.city?.name_en ?? ''})`
      try { await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managers, message, sms: severity === 'emergency' }) }) } catch {}
    }
  }
  await supabase.from('audit_log').insert({ user_id: user.id, action: 'FLAG_RAISED', table_name: 'flags', record_id: data.id, new_values: { severity, category, description } })
  return NextResponse.json(data, { status: 201 })
}
