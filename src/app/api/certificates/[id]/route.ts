import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

async function generatePDF(trainee: any, course: any, verificationCode: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])
  const { width, height } = page.getSize()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.98, 0.97) })
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: rgb(0.08, 0.15, 0.5) })
  page.drawRectangle({ x: 0, y: 0, width, height: 8, color: rgb(0.08, 0.15, 0.5) })
  page.drawRectangle({ x: 48, y: 40, width: 4, height: height - 80, color: rgb(0.08, 0.15, 0.5) })

  page.drawText('SOL FOR BUSINESS SOLUTION', { x: 72, y: height - 72, size: 11, font: fontBold, color: rgb(0.08, 0.15, 0.5) })
  page.drawText('CERTIFICATE OF COMPLETION', { x: 72, y: height - 120, size: 28, font: fontBold, color: rgb(0.07, 0.07, 0.07) })
  page.drawText('شهادة إتمام الدورة التدريبية', { x: 72, y: height - 150, size: 14, font: fontRegular, color: rgb(0.45, 0.45, 0.45) })
  page.drawLine({ start: { x: 72, y: height - 170 }, end: { x: width - 72, y: height - 170 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  page.drawText('This certifies that', { x: 72, y: height - 210, size: 13, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
  const nameEn = trainee.full_name_en
  const nameFontSize = nameEn.length > 30 ? 26 : 32
  page.drawText(nameEn, { x: 72, y: height - 255, size: nameFontSize, font: fontBold, color: rgb(0.07, 0.07, 0.07) })

  page.drawText('has successfully completed', { x: 72, y: height - 325, size: 13, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
  const titleSize = course.title_en.length > 40 ? 16 : 20
  page.drawText(course.title_en, { x: 72, y: height - 360, size: titleSize, font: fontBold, color: rgb(0.07, 0.07, 0.07) })

  const cityName = course.city?.name_en ?? ''
  const dateStr = `${formatCertDate(course.day1_date)} – ${formatCertDate(course.day2_date)}  ·  ${cityName}`
  page.drawText(dateStr, { x: 72, y: height - 415, size: 12, font: fontRegular, color: rgb(0.55, 0.55, 0.55) })

  page.drawLine({ start: { x: 72, y: 100 }, end: { x: width - 72, y: 100 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sol-ops.vercel.app'
  page.drawText('VERIFICATION CODE', { x: 72, y: 78, size: 8, font: fontBold, color: rgb(0.6, 0.6, 0.6) })
  page.drawText(verificationCode, { x: 72, y: 58, size: 13, font: fontBold, color: rgb(0.07, 0.07, 0.07) })
  page.drawText(`Verify at: ${appUrl}/verify/${verificationCode}`, { x: 72, y: 38, size: 9, font: fontRegular, color: rgb(0.6, 0.6, 0.6) })

  page.drawLine({ start: { x: width - 220, y: 140 }, end: { x: width - 72, y: 140 }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) })
  page.drawText('Authorized Signature', { x: width - 210, y: 122, size: 9, font: fontRegular, color: rgb(0.55, 0.55, 0.55) })
  page.drawText('SOL For Business Solution', { x: width - 210, y: 108, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) })

  return pdfDoc.save()
}

// DELETE a certificate
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { error } = await supabase.from('certificates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH — regenerate certificate with new verification code + version bump
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['super_admin', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: cert } = await supabase.from('certificates')
    .select('*, trainee:trainees(*), course:courses(*, city:cities(name_en, name_ar))')
    .eq('id', id).single()
  if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })

  try {
    const newCode = generateCode()
    const newVersion = (cert.version ?? 1) + 1
    const pdfBytes = await generatePDF(cert.trainee, cert.course, newCode)
    const fileName = `${cert.course_id}/${cert.trainee_id}-v${newVersion}.pdf`

    const { error: uploadError } = await adminClient.storage
      .from('certificates')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = adminClient.storage.from('certificates').getPublicUrl(fileName)

    const { data: updated, error: updateError } = await supabase.from('certificates').update({
      verification_code: newCode,
      pdf_url: urlData.publicUrl,
      version: newVersion,
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    }).eq('id', id).select().single()

    if (updateError) throw new Error(updateError.message)

    await supabase.from('audit_log').insert({
      user_id: user.id, action: 'CERTIFICATE_REGENERATED',
      table_name: 'certificates', record_id: id,
      new_values: { version: newVersion, new_code: newCode },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
