import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { course_id, trainees } = await request.json()
  if (!course_id || !Array.isArray(trainees) || trainees.length === 0) return NextResponse.json({ error: 'course_id and trainees array required' }, { status: 400 })
  const errors: any[] = []
  const valid: any[] = []
  trainees.forEach((t: any, i: number) => {
    if (!t.full_name_en || !t.full_name_ar || !t.phone) errors.push({ row: i + 1, error: 'Missing required fields' })
    else if (!t.national_id_last4 || !/^\d{4}$/.test(t.national_id_last4)) errors.push({ row: i + 1, error: 'national_id_last4 must be 4 digits' })
    else valid.push({ course_id, full_name_en: t.full_name_en.trim(), full_name_ar: t.full_name_ar.trim(), national_id_last4: t.national_id_last4, phone: t.phone.trim(), email: t.email?.trim() ?? null, consent_given: true, consent_given_at: new Date().toISOString() })
  })
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })
  const { data, error } = await supabase.from('trainees').insert(valid).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ imported: data?.length ?? 0 }, { status: 201 })
}
