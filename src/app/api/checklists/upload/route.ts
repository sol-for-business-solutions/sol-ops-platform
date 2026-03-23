import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const formData = await request.formData()
  const file = formData.get('file') as File
  const item_id = formData.get('item_id') as string
  if (!file || !item_id) return NextResponse.json({ error: 'File and item_id required' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  const ext = file.name.split('.').pop()
  const fileName = `${item_id}-${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()
  const { data, error } = await supabase.storage.from('checklist-photos').upload(fileName, buffer, { contentType: file.type, upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: urlData } = supabase.storage.from('checklist-photos').getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}
