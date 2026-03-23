import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { requireRole } from '@/lib/auth'

export default async function ReportsPage() {
  await requireRole(['super_admin', 'manager'])
  const supabase = await createClient()
  const { data: courses } = await supabase.from('courses')
    .select('id, title_en, status, day1_date, city:cities(name_en)')
    .in('status', ['in_progress', 'completed'])
    .order('day1_date', { ascending: false })
  return <ReportsClient courses={courses ?? []} />
}
