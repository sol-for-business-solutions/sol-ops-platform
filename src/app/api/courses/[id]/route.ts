import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('courses')
    .select('*, city:cities(*), course_assignments(id, coordinator:profiles!course_assignments_coordinator_id_fkey(id, full_name, full_name_ar, phone, email))')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data: old } = await supabase.from('courses').select('*').eq('id', id).single()
  const { data, error } = await supabase.from('courses')
    .update({ ...body, updated_by: user.id }).eq('id', id).select('*, city:cities(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('audit_log').insert({
    user_id: user.id, action: 'UPDATE', table_name: 'courses', record_id: id, old_values: old, new_values: data
  })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('audit_log').insert({
    user_id: user.id, action: 'DELETE', table_name: 'courses', record_id: id
  })
  return NextResponse.json({ success: true })
}
