import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// FR-706: Scheduled/on-demand report delivery via email
// POST body: { frequency?: 'daily' | 'weekly'; recipient_emails?: string[] }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, email, full_name').eq('id', user.id).single()
  if (!['super_admin', 'manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const recipientEmails: string[] = body.recipient_emails ?? [profile?.email].filter(Boolean)
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'Email not configured (RESEND_API_KEY missing)' }, { status: 503 })

  // Build summary stats
  const today = new Date()
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
  const todayStr = today.toISOString().split('T')[0]
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const [
    { data: activeCourses },
    { data: recentFlags },
    { count: certCount },
    { data: coordinators },
  ] = await Promise.all([
    supabase.from('courses').select('id, title_en, status, city:cities(name_en)').in('status', ['in_progress', 'scheduled']).order('day1_date'),
    supabase.from('flags').select('severity, status, description, created_at, course:courses(title_en)').neq('status', 'resolved').order('created_at', { ascending: false }).limit(10),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name').eq('role', 'coordinator').eq('is_active', true),
  ])

  const openEmergency = recentFlags?.filter(f => f.severity === 'emergency').length ?? 0
  const openCritical = recentFlags?.filter(f => f.severity === 'critical').length ?? 0
  const dateLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const flagsHtml = recentFlags && recentFlags.length > 0
    ? recentFlags.map(f => {
        const color = { emergency: '#dc2626', critical: '#ea580c', warning: '#d97706', info: '#2563eb' }[f.severity] ?? '#888'
        return `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0"><span style="color:${color};font-weight:600;text-transform:uppercase;font-size:11px">${f.severity}</span></td><td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px">${(f.course as any)?.title_en ?? '—'}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#555">${f.description.slice(0, 80)}${f.description.length > 80 ? '…' : ''}</td></tr>`
      }).join('') : '<tr><td colspan="3" style="padding:12px;color:#999;font-size:13px">No open flags — all clear!</td></tr>'

  const coursesHtml = activeCourses && activeCourses.length > 0
    ? activeCourses.map(c => `<li style="margin:4px 0;font-size:13px"><strong>${(c.city as any)?.name_en ?? '?'}</strong> — ${c.title_en} <span style="color:#999">(${c.status.replace('_', ' ')})</span></li>`).join('')
    : '<li style="color:#999;font-size:13px">No active courses</li>'

  const html = `
<div style="font-family:sans-serif;max-width:640px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#0d1a5c,#142680);padding:32px 28px;border-radius:12px 12px 0 0">
    <p style="color:#93c5fd;margin:0;font-size:13px">Operations Digest</p>
    <h1 style="color:#fff;margin:8px 0 4px;font-size:22px">SOL Operations Summary</h1>
    <p style="color:#bfdbfe;margin:0;font-size:13px">${dateLabel}</p>
  </div>
  <div style="padding:28px;background:#f8fafc;border-radius:0 0 12px 12px">
    <!-- KPI row -->
    <div style="display:flex;gap:12px;margin-bottom:24px">
      <div style="flex:1;background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:26px;font-weight:700;color:#142680">${activeCourses?.length ?? 0}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Active / Scheduled</p>
      </div>
      <div style="flex:1;background:${openEmergency > 0 ? '#fef2f2' : openCritical > 0 ? '#fff7ed' : '#f0fdf4'};border-radius:8px;padding:16px;border:1px solid ${openEmergency > 0 ? '#fecaca' : openCritical > 0 ? '#fed7aa' : '#bbf7d0'};text-align:center">
        <p style="margin:0;font-size:26px;font-weight:700;color:${openEmergency > 0 ? '#dc2626' : openCritical > 0 ? '#ea580c' : '#16a34a'}">${recentFlags?.length ?? 0}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Open Flags</p>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:26px;font-weight:700;color:#142680">${certCount ?? 0}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Certificates Total</p>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:26px;font-weight:700;color:#142680">${coordinators?.length ?? 0}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Coordinators</p>
      </div>
    </div>
    <!-- Active courses -->
    <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;margin-bottom:16px">
      <h3 style="margin:0 0 12px;font-size:14px;color:#1e293b">Active &amp; Scheduled Courses</h3>
      <ul style="margin:0;padding-left:18px">${coursesHtml}</ul>
    </div>
    <!-- Open flags -->
    <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0;margin-bottom:24px">
      <h3 style="margin:0 0 12px;font-size:14px;color:#1e293b">Open Flags Requiring Attention</h3>
      <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th style="text-align:left;padding:8px;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600">Severity</th><th style="text-align:left;padding:8px;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600">Course</th><th style="text-align:left;padding:8px;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600">Description</th></tr></thead><tbody>${flagsHtml}</tbody></table>
    </div>
    <div style="text-align:center">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#142680;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open Dashboard →</a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px">SOL For Business Solution — Operations Excellence Platform</p>
  </div>
</div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SOL Operations <digest@sol.sa>',
        to: recipientEmails,
        subject: `SOL Ops Digest — ${dateLabel}`,
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.message ?? 'Email send failed' }, { status: 500 })
    }
    return NextResponse.json({ sent: true, recipients: recipientEmails.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
