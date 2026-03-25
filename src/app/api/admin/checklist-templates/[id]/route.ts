import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/admin/checklist-templates/[id] — update template
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const updates: Record<string, any> = {}
  if (body.title_en !== undefined) updates.title_en = body.title_en.trim()
  if (body.title_ar !== undefined) updates.title_ar = body.title_ar.trim()
  if (body.description !== undefined) updates.description = body.description
  if (body.requires_photo !== undefined) updates.requires_photo = body.requires_photo
  if (body.order_index !== undefined) updates.order_index = body.order_index
  if (body.is_active !== undefined) updates.is_active = body.is_active
  if (body.phase !== undefined) updates.phase = body.phase
  if (body.course_type !== undefined) updates.course_type = body.course_type

  const { data, error } = await supabase
    .from('checklist_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'CHECKLIST_TEMPLATE_UPDATED',
    table_name: 'checklist_templates',
    record_id: id,
    new_values: updates,
    ip_address: ip,
  })

  return NextResponse.json(data)
}

// DELETE /api/admin/checklist-templates/[id] — deactivate (soft delete)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin')
    return NextResponse.json({ error: 'Only super admins can delete templates' }, { status: 403 })

  // Soft delete — set is_active = false
  const { error } = await supabase
    .from('checklist_templates')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'CHECKLIST_TEMPLATE_DEACTIVATED',
    table_name: 'checklist_templates',
    record_id: id,
    ip_address: ip,
  })

  return NextResponse.json({ success: true })
}
