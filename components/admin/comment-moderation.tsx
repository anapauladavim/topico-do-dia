'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteComment } from '@/app/actions/questions'
import { Button } from '@/components/ui/button'
import type { Comment } from '@/lib/types'

export function CommentModeration({ questionId, comments }: { questionId: string; comments: Comment[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  function remove(commentId: string) {
    if (!confirm('Remover este comentário do mural público?')) return
    startTransition(async () => {
      const result = await deleteComment(commentId, questionId)
      if (!result.ok) return toast.error(result.error ?? 'Não foi possível remover.')
      toast.success('Comentário removido.')
      router.refresh()
    })
  }
  return <section className="paper-sheet mt-8 border border-border p-5"><h2 className="font-hand text-2xl font-bold">Moderação · {comments.length} comentários</h2>{comments.length === 0 ? <p className="mt-3 font-hand text-muted-foreground">Nenhum comentário neste tópico.</p> : <ul className="mt-4 flex flex-col gap-3">{comments.map(comment => <li key={comment.id} className="border-l-2 border-primary/60 pl-3"><div className="flex items-center justify-between gap-3"><p className="font-hand font-bold">{comment.nickname}</p><Button type="button" variant="destructive" size="sm" disabled={pending} onClick={() => remove(comment.id)} className="font-hand">Remover</Button></div><p className="mt-1 whitespace-pre-wrap break-words font-hand">{comment.body}</p><p className="mt-1 font-hand text-xs text-muted-foreground">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(comment.created_at))}</p></li>)}</ul>}</section>
}
