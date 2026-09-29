'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitOpenResponse } from '@/app/actions/public'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Question } from '@/lib/types'

export function OpenResponseForm({ question }: { question: Question }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const limit = question.open_response_char_limit || 280

  function handleSubmit() {
    if (body.trim().length === 0) {
      toast.error('Escreva uma resposta.')
      return
    }
    const fd = new FormData()
    fd.set('questionId', question.id)
    fd.set('body', body.trim())
    startTransition(async () => {
      const res = await submitOpenResponse(fd)
      if (res.ok) {
        toast.success('Resposta enviada! Obrigado por participar.')
        setBody('')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Não foi possível enviar.')
        if (res.error?.includes('já respondeu')) router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, limit))}
        placeholder="Escreva sua resposta aqui..."
        rows={4}
        maxLength={limit}
        disabled={pending}
        className="resize-none font-hand text-lg leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <span className="font-hand text-sm text-muted-foreground">
          {body.length}/{limit}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={pending}
          className="font-bold uppercase tracking-wide"
        >
          {pending ? 'Enviando...' : 'Enviar resposta'}
        </Button>
      </div>
    </div>
  )
}
