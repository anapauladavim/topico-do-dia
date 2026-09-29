'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  setQuestionStatus,
  duplicateQuestion,
  deleteQuestion,
} from '@/app/actions/questions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { QuestionStatus } from '@/lib/types'

export function QuestionActions({
  id,
  status,
}: {
  id: string
  status: QuestionStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(success)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Algo deu errado.')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-hand" disabled={pending}>
          Ações
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-hand">
        {status !== 'published' && (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setQuestionStatus(id, 'published'), 'Pergunta publicada.')
            }
          >
            Publicar agora
          </DropdownMenuItem>
        )}
        {status === 'published' && (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setQuestionStatus(id, 'closed'), 'Votação encerrada.')
            }
          >
            Encerrar votação
          </DropdownMenuItem>
        )}
        {status !== 'draft' && (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setQuestionStatus(id, 'draft'), 'Movida para rascunho.')
            }
          >
            Mover para rascunho
          </DropdownMenuItem>
        )}
        {status !== 'archived' && (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setQuestionStatus(id, 'archived'), 'Pergunta arquivada.')
            }
          >
            Arquivar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => run(() => duplicateQuestion(id), 'Pergunta duplicada.')}
        >
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => {
            if (
              confirm(
                'Excluir esta pergunta e todas as respostas/comentários? Esta ação não pode ser desfeita.',
              )
            ) {
              run(() => deleteQuestion(id), 'Pergunta excluída.')
            }
          }}
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
