import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function formatCertDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function generatePDF(trainee: any, course: any, verificationCode: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])
  const { width, height } = page.getSize()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.98, 0.97) })
  // Top border bar
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: rgb(0.07, 0.07, 0.07) })
  // Bottom border bar
  page.drawRectangle({ x: 0, y: 0, width, height: 8, color: rgb(0.07, 0.07, 0.07) })
  // Left accent bar
  page.drawRectangle({ x: 48, y: 40, width: 4, height: height - 80, color: rgb(0.07, 0.07, 0.07) })

  // Header
  page.drawText('SOL FOR BUSINESS SOLUTION', { x: 72, y: height - 72, size: 11, font: fontBold, color: rgb(0.07, 0.07, 0.07), letterSpacing: 2 })
  page.drawText('CERTIFICATE OF COMPLETION', { x: 72, y: height - 120, size: 28, font: fontBold, color: rgb(0.07, 0.07, 0.07) })
  page.drawText('شهادة إتمام الدورة التدريبية', { x: 72, y: height - 150, size: 14, font: fontRegular, color: rgb(0.45, 0.45, 0.45) })

  // Divider
  page.drawLine({ start: { x: 72, y: height - 170 }, end: { x: width - 72, y: height - 170 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  // Recipient
  page.drawText('This certifies that', { x: 72, y: height - 210, size: 13, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
  const nameEn = trainee.full_name_en
  const nameFontSize = nameEn.length > 30 ? 26 : 32
  page.drawText(nameEn, { x: 72, y: height - 255, size: nameFontSize, font: fontBold, color: rgb(0.07, 0.07, 0.07) })
  if (trainee.full_name_ar) {
    page.drawText(trainee.full_name_ar, { x: 72, y: height - 285, size: 16, font: fontRegular, color: rgb(0.45, 0.45, 0.45) })
  }

  // Course
  page.drawText('has successfully completed', { x: 72, y: height - 325, size: 13, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
  const titleSize = course.title_en.length > 40 ? 16 : 20
  page.drawText(course.title_en, { x: 72, y: height - 360, size: titleSize, font: fontBold, color: rgb(0.07, 0.07, 0.07) })
  if (course.title_ar) {
    page.drawText(course.title_ar, { x: 72, y: height - 385, size: 13, font: fontRegular, color: rgb(0.45, 0.45, 0.45) })
  }

  const cityName = course.city?.name_en ?? ''
  const dateStr = `${formatCertDate(course.day1_date)} – ${formatCertDate(course.day2_date)}  ·  ${cityName}`
  page.drawText(dateStr, { x: 72, y: height - 415, size: 12, font: fontRegular, color: rgb(0.55, 0.55, 0.55) })

  // Footer line
  page.drawLine({ start: { x: 72, y: 100 }, end: { x: width - 72, y: 100 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  // Verification
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sol-ops.vercel.app'
  page.drawText('VERIFICATION CODE', { x: 72, y: 78, size: 8, font: fontBold, color: rgb(0.6, 0.6, 0.6), letterSpacing: 1.5 })
  page.drawText(verificationCode, { x: 72, y: 58, size: 13, font: fontBold, color: rgb(0.07, 0.07, 0.07), letterSpacing: 2 })
  page.drawText(`Verify at: ${appUrl}/verify/${verificationCode}`, { x: 72, y: 38, size: 9, font: fontRegular, color: rgb(0.6, 0.6, 0.6) })

  // Signature
  page.drawLine({ start: { x: width - 220, y: 140 }, end: { x: width - 72, y: 140 }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) })
  page.drawText('Authorized Signature', { x: width - 210, y: 122, size: 9, font: fontRegular, color: rgb(0.55, 0.55, 0.55) })
  page.drawText('SOL For Business Solution', { x: width - 210, y: 108, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  let query = supabase.from('certificates')
    .select('*, trainee:trainees(id, full_name_en, full_name_ar, email), course:courses(id, title_en, title_ar, day1_date, day2_date, city:cities(name_en, name_ar))')
    .order('generated_at', { ascending: false })
  if (course_id) query = query.eq('course_id', course_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const { data: course } = await supabase.from('courses')
    .select('*, city:cities(name_en, name_ar)').eq('id', course_id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const { data: trainees } = await supabase.from('trainees').select('*').eq('course_id', course_id)
  if (!trainees || trainees.length === 0) {
    return NextResponse.json({ error: 'No trainees registered for this course' }, { status: 400 })
  }

  const { data: attendance } = await supabase.from('attendance')
    .select('*').eq('course_id', course_id).eq('is_present', true)

  const sessions = ['day1_am', 'day1_pm', 'day2_am', 'day2_pm']
  const eligible = trainees.filter(trainee =>
    sessions.filter(s => attendance?.some((a: any) => a.trainee_id === trainee.id && a.session === s)).length >= 3
  )

  if (eligible.length === 0) {
    return NextResponse.json({ error: 'No trainees meet the eligibility requirement (3+ sessions attended)' }, { status: 400 })
  }

  let generated = 0; let skipped = 0

  for (const trainee of eligible) {
    const { data: existing } = await supabase.from('certificates')
      .select('id').eq('trainee_id', trainee.id).eq('course_id', course_id).single()
    if (existing) { skipped++; continue }

    const verificationCode = generateCode()
    const pdfBuffer = await generatePDF(trainee, course, verificationCode)
    const fileName = `${course_id}/${trainee.id}-v1.pdf`

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })
    if (uploadError) continue

    const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(fileName)
    await supabase.from('certificates').insert({
      trainee_id: trainee.id, course_id,
      pdf_url: urlData.publicUrl,
      verification_code: verificationCode,
      generated_by: user.id,
    })
    generated++
  }

  await supabase.from('audit_log').insert({
    user_id: user.id, action: 'CERTIFICATES_GENERATED',
    table_name: 'certificates',
    new_values: { course_id, generated, skipped, eligible: eligible.length, total: trainees.length }
  })

  return NextResponse.json({ generated, skipped, eligible: eligible.length, total: trainees.length })
}
