// PDF generation is now handled directly in /api/certificates POST
// This file is kept for compatibility
import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'Use POST /api/certificates instead' }, { status: 410 })
}
