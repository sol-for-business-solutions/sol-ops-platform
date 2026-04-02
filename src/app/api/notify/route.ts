import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
// POST /api/notify
// Body: { managers: [{email, phone, full_name}], message: string, sms?: boolean }
export async function POST(request: Request) {
  const { managers, message, sms = false } = await request.json()
  const results: { email?: boolean; sms?: boolean; errors: string[] } = { errors: [] }

  // ── Email via Resend ─────────────────────────────────────────────────────
  
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,      // your Gmail address
    pass: process.env.GMAIL_APP_KEY,   // 16-char app password
  },
})

const emails = (managers as any[]).filter(m => m.email).map(m => m.email)
if (emails.length > 0) {
  try {
    await transporter.sendMail({
      from: `"SOL Operations" <${process.env.GMAIL_USER}>`,
      to: emails.join(','),
      subject: 'SOL Ops Alert — Action Required',
      html: `<p>${message}</p>`,
    })
    results.email = true
  } catch (e: any) {
    results.errors.push(`Email: ${e.message}`)
  }
}

  // ── SMS via Unifonic (FR-304 / NFR) ─────────────────────────────────────
  const unifonicSid = process.env.UNIFONIC_APP_SID
  const unifonicSender = process.env.UNIFONIC_SENDER_ID ?? 'SOL'

  if (sms && unifonicSid) {
    const phones = (managers as any[]).filter((m) => m.phone).map((m) => m.phone)

    const normalisePhone = (p: string) => {
      const digits = p.replace(/\D/g, '')
      if (digits.startsWith('966')) return `+${digits}`
      if (digits.startsWith('0')) return `+966${digits.slice(1)}`
      if (digits.length === 9) return `+966${digits}`
      return `+${digits}`
    }

    const smsErrors: string[] = []
    for (const phone of phones) {
      const recipient = normalisePhone(phone)
      try {
        const form = new URLSearchParams({
          AppSid: unifonicSid,
          SenderID: unifonicSender,
          Recipient: recipient,
          Body: message.replace(/<[^>]*>/g, ''),
        })
        const res = await fetch('https://api.unifonic.com/rest/Messages/Send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json.Success === false) {
          smsErrors.push(`${recipient}: ${json.Message ?? res.statusText}`)
        }
      } catch (e: any) {
        smsErrors.push(`${recipient}: ${e.message}`)
      }
    }

    results.sms = smsErrors.length === 0
    if (smsErrors.length > 0) results.errors.push(...smsErrors.map((e: string) => `SMS: ${e}`))
  }

  return NextResponse.json({ sent: true, ...results })
}
