import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const data = await request.json()
  console.log('[CLIENT LOG]', data)
  return NextResponse.json({ ok: true })
} 