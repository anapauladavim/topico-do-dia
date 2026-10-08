'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitComment } from '@/app/actions/public'
import { loadComments } from '@/app/actions/comments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Comment } from '@/lib/types'

const NICK_KEY = 'tdd_nickname'
const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-0', '-rotate-2', 'rotate-2']

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora mesmo'
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d} d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function CommentsSection({ questionId, initialComments, initialTotal, initialHasMore }: {
  questionId: string
  initialComments: Comment[]
  initialTotal: number
  initialHasMore: boolean
}) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nickname, setNickname] = useState('')
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const [loadingMore, startLoadMore] = useTransition()

  useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(NICK_KEY)
      if (stored) setNickname(stored)
    }
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nickname.trim().length < 2) return toast.error('Informe um apelido (mín. 2 caracteres).')
    if (body.trim().length < 2) return toast.error('Escreva um comentário.')
    const fd = new FormData()
    fd.set('questionId', questionId)
    fd.set('nickname', nickname.trim())
    fd.set('body', body.trim())
    startTransition(async () => {
      const res = await submitComment(fd)
      if (res.ok) {
        if (typeof window !== 'undefined') window.localStorage.setItem(NICK_KEY, nickname.trim())
        setBody('')
        toast.success('Comentário publicado!')
        const page = await loadComments(questionId, 0)
        setComments(page.comments); setTotal(page.total); setHasMore(page.hasMore); router.refresh()
      } else toast.error(res.error ?? 'Não foi possível comentar.')
    })
  }

  function handleLoadMore() {
    startLoadMore(async () => {
      const page = await loadComments(questionId, comments.length)
      setComments((prev) => [...prev, ...page.comments])
      setTotal(page.total); setHasMore(page.hasMore)
    })
  }

  return (
    <section aria-labelledby="birot-heading" className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 id="birot-heading" className="font-hand text-2xl font-bold -rotate-1">Birot comenta</h2>
        <span className="font-hand text-sm text-muted-foreground">{total} comentário{total === 1 ? '' : 's'}</span>
      </div>

      <form onSubmit={handleSubmit} className="paper-sheet flex flex-col gap-3 border border-border p-4">
        <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Seu apelido" maxLength={40} disabled={pending} className="font-hand text-base" aria-label="Apelido" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 1000))} placeholder="Escreva um comentário..." rows={3} maxLength={1000} disabled={pending} className="resize-none font-hand text-base" aria-label="Comentário" />
        <div className="flex items-center justify-between">
          <span className="font-hand text-xs text-muted-foreground">{body.length}/1000</span>
          <Button type="submit" disabled={pending} className="font-bold uppercase tracking-wide">{pending ? 'Publicando...' : 'Comentar'}</Button>
        </div>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2">
        {comments.length === 0 && <li className="font-hand text-muted-foreground sm:col-span-2">Ainda não há comentários. Comece a conversa!</li>}
        {comments.map((c, i) => (
          <li key={c.id} className={cn('post-it min-h-32 p-5', ROTATIONS[i % ROTATIONS.length])}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-hand text-lg font-bold">{c.nickname}</span>
              <span className="font-hand text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words font-hand text-base leading-relaxed">{c.body}</p>
          </li>
        ))}
      </ul>

      {hasMore && <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="font-hand">{loadingMore ? 'Carregando...' : 'Ver mais comentários'}</Button>}
    </section>
  )
}
