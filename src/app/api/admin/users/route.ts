import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only super_admin can manage users
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, full_name_ar, role, phone, is_active, created_at')
    .order('full_name')

  return NextResponse.json(users ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { email, password, full_name, full_name_ar, role, phone } = await request.json()

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'email, password, full_name and role are required' }, { status: 400 })
  }

  const validRoles = ['super_admin', 'manager', 'coordinator', 'viewer']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Use admin client to create the auth user
  const adminClient = createAdminClient()
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm so user can log in immediately
    user_metadata: { full_name },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Update the profile that was auto-created by the trigger
  const { data: updatedProfile, error: profileError } = await adminClient
    .from('profiles')
    .update({
      role,
      full_name: full_name.trim(),
      full_name_ar: (full_name_ar ?? '').trim(),
      phone: phone ?? null,
      is_active: true,
    })
    .eq('id', newUser.user.id)
    .select()
    .single()

  if (profileError) {
    // Rollback: delete the auth user if profile update failed
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: 'Failed to set user profile: ' + profileError.message }, { status: 500 })
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'USER_CREATED',
    table_name: 'profiles',
    record_id: newUser.user.id,
    new_values: { email, role, full_name },
    ip_address: ip,
  })

  return NextResponse.json(updatedProfile, { status: 201 })
}
