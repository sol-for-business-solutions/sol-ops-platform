import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  const [{ data: course }, { data: trainees }, { data: attendance }, { data: flags }, { data: certificates }] = await Promise.all([
    supabase.from('courses').select('*, city:cities(*)').eq('id', course_id).single(),
    supabase.from('trainees').select('*').eq('course_id', course_id),
    supabase.from('attendance').select('*').eq('course_id', course_id),
    supabase.from('flags').select('*, raised_by_profile:profiles!flags_raised_by_fkey(full_name)').eq('course_id', course_id),
    supabase.from('certificates').select('*, trainee:trainees(full_name_en)').eq('course_id', course_id),
  ])
  const sessions = ['day1_am', 'day1_pm', 'day2_am', 'day2_pm']
  const traineeReport = (trainees ?? []).map(t => {
    const sessionsAttended = sessions.filter(s => attendance?.some(a => a.trainee_id === t.id && a.session === s && a.is_present)).length
    return { name_en: t.full_name_en, name_ar: t.full_name_ar, national_id_last4: t.national_id_last4, phone: t.phone, sessions_attended: sessionsAttended, eligible: sessionsAttended >= 3, certificate_issued: certificates?.some(c => c.trainee_id === t.id) ?? false }
  })
  const { data: checklistItems } = await supabase.from('checklist_items').select('is_completed').eq('course_id', course_id)
  const checklistCompletion = checklistItems ? Math.round((checklistItems.filter(i => i.is_completed).length / (checklistItems.length || 1)) * 100) : 0
  return NextResponse.json({ course, summary: { totalTrainees: trainees?.length ?? 0, eligibleTrainees: traineeReport.filter(t => t.eligible).length, certificatesIssued: certificates?.length ?? 0, openFlags: flags?.filter(f => f.status !== 'resolved').length ?? 0, resolvedFlags: flags?.filter(f => f.status === 'resolved').length ?? 0, checklistCompletion }, trainees: traineeReport, flags: flags ?? [], certificates: certificates ?? [] })
}
