import { NextResponse } from 'next/server'
import { syncSchedules } from '@/lib/queries'

/** Triggered by Vercel Cron (or another scheduler) to publish/close on time. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return new NextResponse('Não autorizado', { status: 401 })
  }
  await syncSchedules()
  return NextResponse.json({ ok: true })
}
