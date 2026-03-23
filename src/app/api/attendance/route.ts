import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('course_id', course_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trainee_id, course_id, session, is_present } = await request.json()
  if (!trainee_id || !course_id || !session) {
    return NextResponse.json({ error: 'trainee_id, course_id and session required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('attendance')
    .upsert(
      {
        trainee_id,
        course_id,
        session,
        is_present: is_present ?? true,
        marked_by: user.id,
        marked_at: new Date().toISOString(),
      },
      { onConflict: 'trainee_id,session' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
