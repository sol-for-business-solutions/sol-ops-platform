import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { course_id, session, records } = await request.json()
  if (!course_id || !session || !Array.isArray(records)) return NextResponse.json({ error: 'course_id, session and records required' }, { status: 400 })
  const rows = records.map((r: any) => ({ trainee_id: r.trainee_id, course_id, session, is_present: r.is_present ?? true, marked_by: user.id, marked_at: new Date().toISOString() }))
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'trainee_id,session' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: rows.length })
}
