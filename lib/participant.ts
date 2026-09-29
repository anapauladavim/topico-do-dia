import 'server-only'
import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'

const PID_COOKIE = 'tdd_pid'
const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * Returns the current participant id from the cookie, or null if absent.
 * Read-only: safe to call from Server Components.
 */
export async function getParticipantId(): Promise<string | null> {
  const store = await cookies()
  return store.get(PID_COOKIE)?.value ?? null
}

/**
 * Returns the participant id, creating and persisting one if needed.
 * Only call from Server Actions / Route Handlers (it writes a cookie).
 */
export async function ensureParticipantId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(PID_COOKIE)?.value
  if (existing) return existing

  const pid = randomUUID()
  store.set(PID_COOKIE, pid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR,
    path: '/',
  })
  return pid
}
