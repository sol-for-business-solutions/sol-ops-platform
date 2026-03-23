import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('trainees')
    .update({ full_name_en: '[Deleted]', full_name_ar: '[محذوف]', national_id_last4: '0000', phone: '[Deleted]', email: null })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('audit_log').insert({
    user_id: user.id, action: 'TRAINEE_ANONYMIZED', table_name: 'trainees', record_id: id
  })
  return NextResponse.json({ success: true })
}
