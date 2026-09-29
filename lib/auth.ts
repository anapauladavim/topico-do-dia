import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

const ADMIN_COOKIE = 'tdd_admin'
const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours

function signingKey(): string {
  // Derive the HMAC key from server-only secrets. Never sent to the client.
  return `${process.env.SUPABASE_JWT_SECRET ?? ''}:${process.env.ADMIN_PASSWORD ?? ''}`
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('hex')
}

/** Constant-time password check against the ADMIN_PASSWORD env var. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (!expected) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function createToken(): string {
  const expires = Date.now() + SESSION_TTL_MS
  const nonce = randomBytes(8).toString('hex')
  const payload = `${expires}.${nonce}`
  return `${payload}.${sign(payload)}`
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [expires, nonce, sig] = parts
  const payload = `${expires}.${nonce}`
  const expected = sign(payload)
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false
  }
  return Number(expires) > Date.now()
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies()
  store.set(ADMIN_COOKIE, createToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: '/',
  })
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return isValidToken(store.get(ADMIN_COOKIE)?.value)
}

/** Redirects to the login page when there is no valid admin session. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect('/admin/login')
  }
}
