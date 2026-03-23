import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { managers, message } = await request.json()
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    const emails = managers.filter((m: any) => m.email).map((m: any) => m.email)
    if (emails.length > 0) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'SOL Operations <noreply@sol.sa>', to: emails, subject: `SOL Ops Alert`, html: `<p>${message}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/flags">View in Dashboard →</a></p>` }),
      }).catch(() => {})
    }
  }
  return NextResponse.json({ sent: true })
}
