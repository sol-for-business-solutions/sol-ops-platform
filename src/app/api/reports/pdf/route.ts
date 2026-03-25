import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: course }, { data: trainees }, { data: attendance }, { data: flags }, { data: certs }, { data: checklist }] =
    await Promise.all([
      supabase.from('courses').select('*, city:cities(name_en)').eq('id', course_id).single(),
      supabase.from('trainees').select('*').eq('course_id', course_id),
      supabase.from('attendance').select('*').eq('course_id', course_id).eq('is_present', true),
      supabase.from('flags').select('*, raised_by_profile:profiles!flags_raised_by_fkey(full_name)').eq('course_id', course_id),
      supabase.from('certificates').select('trainee_id').eq('course_id', course_id),
      supabase.from('checklist_items').select('is_completed').eq('course_id', course_id),
    ])

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const sessions = ['day1_am', 'day1_pm', 'day2_am', 'day2_pm']
  const traineeData = (trainees ?? []).map(t => {
    const attended = sessions.filter(s => attendance?.some(a => a.trainee_id === t.id && a.session === s)).length
    return { ...t, attended, eligible: attended >= 3, cert: certs?.some(c => c.trainee_id === t.id) ?? false }
  })

  const checklistPct = checklist?.length
    ? Math.round((checklist.filter(i => i.is_completed).length / checklist.length) * 100) : 0
  const openFlags = (flags ?? []).filter(f => f.status !== 'resolved').length
  const resolvedFlags = (flags ?? []).filter(f => f.status === 'resolved').length
  const eligibleCount = traineeData.filter(t => t.eligible).length

  // Build PDF
  const pdfDoc = await PDFDocument.create()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const addPage = () => {
    const p = pdfDoc.addPage([842, 595])
    // Header bar
    p.drawRectangle({ x: 0, y: p.getHeight() - 40, width: p.getWidth(), height: 40, color: rgb(0.08, 0.15, 0.5) })
    p.drawText('SOL FOR BUSINESS SOLUTION — OPERATIONS REPORT', {
      x: 24, y: p.getHeight() - 25, size: 10, font: fontBold, color: rgb(1, 1, 1),
    })
    // Footer
    p.drawLine({ start: { x: 24, y: 24 }, end: { x: p.getWidth() - 24, y: 24 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
    p.drawText(`Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, {
      x: 24, y: 10, size: 8, font: fontReg, color: rgb(0.6, 0.6, 0.6),
    })
    return p
  }

  // ── Page 1: Summary ───────────────────────────────────────────────────────
  const p1 = addPage()
  const W = p1.getWidth(); const H = p1.getHeight()
  let y = H - 70

  p1.drawText('Course Completion Report', { x: 24, y, size: 22, font: fontBold, color: rgb(0.08, 0.15, 0.5) })
  y -= 30
  p1.drawText(course.title_en, { x: 24, y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
  y -= 20
  p1.drawText(`${course.city?.name_en ?? ''} · ${course.venue}  ·  ${course.day1_date} → ${course.day2_date}  ·  Trainer: ${course.trainer_name}`, {
    x: 24, y, size: 10, font: fontReg, color: rgb(0.45, 0.45, 0.45),
  })
  y -= 30

  // Summary cards
  const cards = [
    { label: 'Total Trainees', value: String(trainees?.length ?? 0) },
    { label: 'Cert. Eligible', value: String(eligibleCount) },
    { label: 'Certificates Issued', value: String(certs?.length ?? 0) },
    { label: 'Checklist Complete', value: `${checklistPct}%` },
    { label: 'Open Flags', value: String(openFlags) },
    { label: 'Resolved Flags', value: String(resolvedFlags) },
  ]
  const cardW = (W - 48 - 10 * 5) / 6
  cards.forEach((card, i) => {
    const cx = 24 + i * (cardW + 10)
    p1.drawRectangle({ x: cx, y: y - 50, width: cardW, height: 50, color: rgb(0.97, 0.97, 1), borderColor: rgb(0.85, 0.88, 1), borderWidth: 0.5 })
    p1.drawText(card.value, { x: cx + cardW / 2 - (card.value.length * 6), y: y - 22, size: 18, font: fontBold, color: rgb(0.08, 0.15, 0.5) })
    p1.drawText(card.label, { x: cx + 6, y: y - 42, size: 7, font: fontReg, color: rgb(0.5, 0.5, 0.5) })
  })
  y -= 70

  // Session attendance bar chart (inline SVG-style rectangles)
  const sessionLabels = ['Day 1 AM', 'Day 1 PM', 'Day 2 AM', 'Day 2 PM']
  const sessionKeys = ['day1_am', 'day1_pm', 'day2_am', 'day2_pm']
  const total = trainees?.length ?? 1
  const barMaxW = 120
  p1.drawText('Session Attendance', { x: 24, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
  y -= 16

  sessionKeys.forEach((sess, i) => {
    const present = attendance?.filter(a => a.session === sess).length ?? 0
    const pct = total > 0 ? present / total : 0
    const bx = 24 + i * 160
    p1.drawText(sessionLabels[i], { x: bx, y, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) })
    p1.drawRectangle({ x: bx, y: y - 16, width: barMaxW, height: 10, color: rgb(0.93, 0.93, 0.97) })
    p1.drawRectangle({ x: bx, y: y - 16, width: barMaxW * pct, height: 10, color: rgb(0.08, 0.15, 0.5) })
    p1.drawText(`${present}/${total}`, { x: bx + barMaxW + 4, y: y - 10, size: 8, font: fontReg, color: rgb(0.4, 0.4, 0.4) })
  })
  y -= 36

  // Flags summary
  if ((flags ?? []).length > 0) {
    p1.drawText('Flags Raised', { x: 24, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
    y -= 16
    const severityColors: Record<string, [number, number, number]> = {
      info: [0.2, 0.4, 0.9], warning: [0.8, 0.55, 0.1], critical: [0.85, 0.35, 0], emergency: [0.85, 0.1, 0.1]
    }
    ;(flags ?? []).slice(0, 8).forEach(flag => {
      const col = severityColors[flag.severity] ?? [0.4, 0.4, 0.4]
      p1.drawRectangle({ x: 24, y: y - 10, width: 6, height: 10, color: rgb(...col) })
      const text = `[${flag.severity.toUpperCase()}] ${flag.description.slice(0, 100)}${flag.description.length > 100 ? '…' : ''}`
      p1.drawText(text, { x: 34, y: y - 2, size: 8, font: fontReg, color: rgb(0.2, 0.2, 0.2) })
      y -= 14
    })
  }

  // ── Page 2: Trainee List ──────────────────────────────────────────────────
  if (traineeData.length > 0) {
    const p2 = addPage()
    let ty = p2.getHeight() - 60
    p2.drawText('Trainee Attendance & Certificate Status', { x: 24, y: ty, size: 14, font: fontBold, color: rgb(0.08, 0.15, 0.5) })
    ty -= 20

    // Table header
    const cols = [{ x: 24, w: 180, label: 'Name' }, { x: 210, w: 60, label: 'ID (last 4)' }, { x: 276, w: 60, label: 'Sessions' }, { x: 342, w: 60, label: 'Eligible' }, { x: 408, w: 70, label: 'Certificate' }]
    p2.drawRectangle({ x: 24, y: ty - 14, width: 500, height: 16, color: rgb(0.08, 0.15, 0.5) })
    cols.forEach(col => {
      p2.drawText(col.label, { x: col.x + 4, y: ty - 9, size: 8, font: fontBold, color: rgb(1, 1, 1) })
    })
    ty -= 14

    traineeData.slice(0, 30).forEach((t, idx) => {
      const bg = idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.99)
      p2.drawRectangle({ x: 24, y: ty - 12, width: 500, height: 14, color: bg })
      p2.drawText(t.full_name_en.slice(0, 28), { x: 28, y: ty - 7, size: 8, font: fontReg, color: rgb(0.1, 0.1, 0.1) })
      p2.drawText(t.national_id_last4, { x: 214, y: ty - 7, size: 8, font: fontReg, color: rgb(0.3, 0.3, 0.3) })
      p2.drawText(`${t.attended}/4`, { x: 280, y: ty - 7, size: 8, font: fontReg, color: rgb(0.3, 0.3, 0.3) })
      p2.drawText(t.eligible ? 'Yes' : 'No', { x: 346, y: ty - 7, size: 8, font: fontBold, color: t.eligible ? rgb(0.1, 0.6, 0.1) : rgb(0.6, 0.1, 0.1) })
      p2.drawText(t.cert ? 'Issued' : '—', { x: 412, y: ty - 7, size: 8, font: fontBold, color: t.cert ? rgb(0.1, 0.5, 0.1) : rgb(0.6, 0.6, 0.6) })
      ty -= 14
      if (ty < 40) return
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Response(Buffer.from(pdfBytes), {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="report-${course_id}.pdf"`,
  },
})
}
