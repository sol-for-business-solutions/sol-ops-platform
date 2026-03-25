import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only super_admin can view audit logs
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit     = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const offset    = (page - 1) * limit
  const action    = searchParams.get('action')       // e.g. COURSE_CREATED
  const table     = searchParams.get('table')        // e.g. courses
  const user_id   = searchParams.get('user_id')
  const from_date = searchParams.get('from')         // ISO date string
  const to_date   = searchParams.get('to')
  const search    = searchParams.get('search')       // free text in action/table/record_id

  let query = supabase
    .from('audit_log')
    .select(`
      *,
      user:profiles!audit_log_user_id_fkey(id, full_name, full_name_ar, email, role)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action)    query = query.eq('action', action)
  if (table)     query = query.eq('table_name', table)
  if (user_id)   query = query.eq('user_id', user_id)
  if (from_date) query = query.gte('created_at', `${from_date}T00:00:00Z`)
  if (to_date)   query = query.lte('created_at', `${to_date}T23:59:59Z`)
  if (search)    query = query.or(
    `action.ilike.%${search}%,table_name.ilike.%${search}%,record_id.ilike.%${search}%`
  )

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  })
}
