import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null

  const { status, resolution_notes } = await request.json()
  const updateData: any = { status }
  if (status === 'acknowledged') {
    updateData.acknowledged_by = user.id
    updateData.acknowledged_at = new Date().toISOString()
  }
  if (status === 'resolved') {
    updateData.resolved_by = user.id
    updateData.resolved_at = new Date().toISOString()
    updateData.resolution_notes = resolution_notes ?? null
  }
  const { data, error } = await supabase.from('flags').update(updateData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('audit_log').insert({
    user_id: user.id, action: `FLAG_${status.toUpperCase()}`,
    table_name: 'flags', record_id: id, new_values: updateData, ip_address: ip
  })
  return NextResponse.json(data)
}
