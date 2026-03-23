import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { is_completed, photo_url } = await request.json()
  const updateData: any = { is_completed, photo_url: photo_url ?? null }
  if (is_completed) {
    updateData.completed_by = user.id
    updateData.completed_at = new Date().toISOString()
  } else {
    updateData.completed_by = null
    updateData.completed_at = null
    updateData.photo_url = null
  }
  const { data, error } = await supabase.from('checklist_items').update(updateData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
