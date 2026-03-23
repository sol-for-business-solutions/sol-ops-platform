import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { coordinator_ids } = await request.json()
  await supabase.from('course_assignments').delete().eq('course_id', id)
  if (coordinator_ids && coordinator_ids.length > 0) {
    const assignments = coordinator_ids.map((cid: string) => ({
      course_id: id, coordinator_id: cid, assigned_by: user.id
    }))
    const { error } = await supabase.from('course_assignments').insert(assignments)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
