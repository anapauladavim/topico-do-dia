'use server'

import { redirect } from 'next/navigation'
import {
  verifyPassword,
  createAdminSession,
  destroyAdminSession,
} from '@/lib/auth'

export interface LoginResult {
  ok: boolean
  error?: string
}

export async function adminLogin(
  _prev: LoginResult | undefined,
  formData: FormData,
): Promise<LoginResult> {
  const password = String(formData.get('password') ?? '')
  if (!password) return { ok: false, error: 'Informe a senha.' }

  // Small artificial delay smooths timing differences on repeated attempts.
  await new Promise((r) => setTimeout(r, 300))

  if (!verifyPassword(password)) {
    return { ok: false, error: 'Senha incorreta.' }
  }

  await createAdminSession()
  redirect('/admin')
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession()
  redirect('/admin/login')
}
