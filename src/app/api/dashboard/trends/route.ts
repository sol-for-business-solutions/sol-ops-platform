import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// FR-707: Month-over-month trend data for last 6 months
export async function GET() {
  const supabase = await createClient()

  const months: { label: string; start: string; end: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    months.push({
      label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      start: d.toISOString().split('T')[0],
      end: endD.toISOString().split('T')[0],
    })
  }

  const data = await Promise.all(months.map(async m => {
    const [{ data: courses }, { count: certCount }, { count: flagCount }, { count: traineeCount }] = await Promise.all([
      supabase.from('courses')
        .select('id, status')
        .gte('day1_date', m.start)
        .lte('day1_date', m.end),
      supabase.from('certificates')
        .select('id', { count: 'exact', head: true })
        .gte('generated_at', `${m.start}T00:00:00Z`)
        .lte('generated_at', `${m.end}T23:59:59Z`),
      supabase.from('flags')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${m.start}T00:00:00Z`)
        .lte('created_at', `${m.end}T23:59:59Z`),
      supabase.from('trainees')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${m.start}T00:00:00Z`)
        .lte('created_at', `${m.end}T23:59:59Z`),
    ])
    return {
      label: m.label,
      courses: courses?.length ?? 0,
      completed: courses?.filter(c => c.status === 'completed').length ?? 0,
      certificates: certCount ?? 0,
      flags: flagCount ?? 0,
      trainees: traineeCount ?? 0,
    }
  }))

  return NextResponse.json(data)
}
