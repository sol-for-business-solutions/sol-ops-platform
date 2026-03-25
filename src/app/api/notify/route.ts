import { NextResponse } from 'next/server'

// POST /api/notify
// Body: { managers: [{email, phone, full_name}], message: string, sms?: boolean }
export async function POST(request: Request) {
  const { managers, message, sms = false } = await request.json()
  const results: { email?: boolean; sms?: boolean; errors: string[] } = { errors: [] }

  // ── Email via Resend ─────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const emails = (managers as any[]).filter((m) => m.email).map((m) => m.email)
    if (emails.length > 0) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'SOL Operations <noreply@sol.sa>',
            to: emails,
            subject: 'SOL Ops Alert — Action Required',
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#142680;margin:0 0 16px">⚠️ SOL Operations Alert</h2>
              <p style="color:#374151;line-height:1.6">${message}</p>
              <p style="margin-top:24px">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/flags"
                   style="background:#142680;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">
                  View in Dashboard →
                </a>
              </p>
              <p style="color:#9ca3af;font-size:12px;margin-top:32px">SOL For Business Solution — Operations Platform</p>
            </div>`,
          }),
        })
        results.email = true
      } catch (e: any) {
        results.errors.push(`Email: ${e.message}`)
      }
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
