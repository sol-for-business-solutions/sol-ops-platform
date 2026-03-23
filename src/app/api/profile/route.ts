import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Any authenticated user can update their own name/phone
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, full_name_ar, phone } = await request.json()
  const updates: any = {}
  if (full_name !== undefined) updates.full_name = full_name.trim()
  if (full_name_ar !== undefined) updates.full_name_ar = full_name_ar.trim()
  if (phone !== undefined) updates.phone = phone

  const { data, error } = await supabase
    .from('profiles').update(updates).eq('id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
