import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Prevent super_admin from demoting themselves
  if (id === user.id) {
    return NextResponse.json({ error: 'You cannot modify your own account role or status' }, { status: 400 })
  }

  const { role, full_name, full_name_ar, phone, is_active, password } = await request.json()

  const updates: Record<string, any> = {}
  if (role !== undefined) updates.role = role
  if (full_name !== undefined) updates.full_name = full_name.trim()
  if (full_name_ar !== undefined) updates.full_name_ar = full_name_ar.trim()
  if (phone !== undefined) updates.phone = phone
  if (is_active !== undefined) updates.is_active = is_active

  const adminClient = createAdminClient()

  if (password && password.length >= 8) {
    const { error: pwErr } = await adminClient.auth.admin.updateUserById(id, { password })
    if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 500 })
  }

  const { data, error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'USER_UPDATED',
    table_name: 'profiles',
    record_id: id,
    new_values: updates,
  })

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (id === user.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

  // Deactivate instead of hard delete (preserves audit trail)
  const adminClient = createAdminClient()
  await adminClient.from('profiles').update({ is_active: false }).eq('id', id)

  await supabase.from('audit_log').insert({
    user_id: user.id, action: 'USER_DEACTIVATED', table_name: 'profiles', record_id: id,
  })

  return NextResponse.json({ success: true })
}
