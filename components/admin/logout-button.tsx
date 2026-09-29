'use client'

import { adminLogout } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={adminLogout}>
      <Button variant="ghost" size="sm" className="font-hand text-sm">
        Sair
      </Button>
    </form>
  )
}
