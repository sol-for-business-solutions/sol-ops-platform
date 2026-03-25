import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  const email = searchParams.get('email')

  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  // PDPL search by email across all courses
  if (email && course_id === 'all') {
    const { data, error } = await supabase
      .from('trainees')
      .select('*')
      .eq('email', email)
      .order('full_name_en')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  const { data, error } = await supabase
    .from('trainees')
    .select('*')
    .eq('course_id', course_id)
    .order('full_name_en')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { course_id, full_name_en, full_name_ar, national_id_last4, phone, email, consent_given } = await request.json()

  if (!course_id || !full_name_en || !full_name_ar || !national_id_last4 || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^\d{4}$/.test(national_id_last4)) {
    return NextResponse.json({ error: 'National ID must be exactly 4 digits' }, { status: 400 })
  }
  if (!consent_given) {
    return NextResponse.json({ error: 'Trainee consent is required (PDPL)' }, { status: 400 })
  }

  const { data, error } = await supabase.from('trainees').insert({
    course_id,
    full_name_en: full_name_en.trim(),
    full_name_ar: full_name_ar.trim(),
    national_id_last4,
    phone: phone.trim(),
    email: email?.trim() ?? null,
    consent_given: true,
    consent_given_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'TRAINEE_REGISTERED',
    table_name: 'trainees',
    record_id: data.id,
    new_values: { course_id, full_name_en, consent_given: true },
    ip_address: ip,
  })

  return NextResponse.json(data, { status: 201 })
}
