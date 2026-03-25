import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// FR-507: Notify absent trainees via SMS after marking morning session attendance
// POST { course_id, session: 'day1_am' | 'day2_am' }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { course_id, session } = await request.json()
  if (!course_id || !session) return NextResponse.json({ error: 'course_id and session required' }, { status: 400 })
  if (!['day1_am', 'day2_am'].includes(session)) {
    return NextResponse.json({ error: 'Only morning sessions support absent notifications' }, { status: 400 })
  }

  const unifonicSid = process.env.UNIFONIC_APP_SID
  if (!unifonicSid) return NextResponse.json({ error: 'SMS not configured (UNIFONIC_APP_SID missing)' }, { status: 503 })

  const { data: trainees } = await supabase
    .from('trainees').select('id, full_name_en, phone').eq('course_id', course_id)
  if (!trainees || trainees.length === 0) return NextResponse.json({ notified: 0 })

  const { data: attendance } = await supabase
    .from('attendance').select('trainee_id, is_present')
    .eq('course_id', course_id).eq('session', session)

  const presentIds = new Set((attendance ?? []).filter(a => a.is_present).map(a => a.trainee_id))
  const absentTrainees = trainees.filter(t => !presentIds.has(t.id))
  if (absentTrainees.length === 0) return NextResponse.json({ notified: 0, message: 'All trainees present' })

  // Get course name for the message
  const { data: course } = await supabase.from('courses').select('title_en').eq('id', course_id).single()
  const dayLabel = session === 'day1_am' ? 'Day 1 morning' : 'Day 2 morning'
  const unifonicSender = process.env.UNIFONIC_SENDER_ID ?? 'SOL'
  const normalise = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.startsWith('966')) return `+${d}`
    if (d.startsWith('0')) return `+966${d.slice(1)}`
    if (d.length === 9) return `+966${d}`
    return `+${d}`
  }

  let notified = 0
  const errors: string[] = []

  for (const trainee of absentTrainees) {
    if (!trainee.phone) continue
    const recipient = normalise(trainee.phone)
    const body = `Dear ${trainee.full_name_en}, you have been marked absent from the ${dayLabel} session of "${course?.title_en ?? 'your course'}". Please contact your coordinator or attend the next session. — SOL For Business Solution`
    try {
      const form = new URLSearchParams({
        AppSid: unifonicSid,
        SenderID: unifonicSender,
        Recipient: recipient,
        Body: body,
      })
      const res = await fetch('https://api.unifonic.com/rest/Messages/Send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.Success !== false) { notified++ }
      else { errors.push(`${recipient}: ${json.Message ?? res.statusText}`) }
    } catch (e: any) {
      errors.push(`${recipient}: ${e.message}`)
    }
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'ABSENT_SMS_SENT',
    table_name: 'attendance',
    new_values: { course_id, session, notified, errors: errors.length, total_absent: absentTrainees.length },
    ip_address: ip,
  })

  return NextResponse.json({ notified, errors, total_absent: absentTrainees.length })
}
