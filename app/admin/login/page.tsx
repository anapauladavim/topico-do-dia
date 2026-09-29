'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { adminLogin, type LoginResult } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full font-hand text-base" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  )
}

export default function AdminLoginPage() {
  const [state, formAction] = useActionState<LoginResult | undefined, FormData>(
    adminLogin,
    undefined,
  )

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="paper-sheet w-full max-w-sm -rotate-1 rounded-md border border-border p-8">
        <div className="mb-6 text-center">
          <h1 className="font-hand text-3xl font-bold">Painel do Birô</h1>
          <p className="mt-1 font-hand text-base text-muted-foreground">
            Área restrita — informe a senha de administrador.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="font-hand text-base">
              Senha
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </div>

          {state?.error && (
            <p
              role="alert"
              className="font-hand text-sm text-destructive"
            >
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </main>
  )
}
