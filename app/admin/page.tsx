import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listAllQuestions } from '@/lib/admin-queries'
import { STATUS_LABELS, RESPONSE_TYPE_LABELS } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/admin/logout-button'
import { QuestionActions } from '@/components/admin/question-actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  await requireAdmin()
  const questions = await listAllQuestions()

  return <main className="mx-auto min-h-dvh max-w-5xl px-4 py-8 md:py-12">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-border pb-5">
      <div><p className="font-hand text-sm text-muted-foreground">TÓPICO DO DIA</p><h1 className="font-hand text-3xl font-bold">Painel do Birô</h1></div>
      <div className="flex items-center gap-2"><Button render={<Link href="/admin/nova" />} className="font-hand">Nova pergunta</Button><LogoutButton /></div>
    </header>
    {questions.length === 0 ? <section className="paper-sheet border border-border p-8 text-center font-hand text-lg">Ainda não há perguntas. Crie a primeira para começar.</section> :
      <div className="grid gap-4">{questions.map((question) => <article key={question.id} className="paper-sheet flex flex-col gap-4 border border-border p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0"><div className="mb-2 flex flex-wrap gap-2"><Badge className="font-hand">{STATUS_LABELS[question.status]}</Badge><Badge variant="outline" className="font-hand">{RESPONSE_TYPE_LABELS[question.response_type]}</Badge></div><h2 className="font-hand text-xl font-bold">{question.question_text}</h2><p className="mt-1 font-hand text-sm text-muted-foreground">{question.responseCount} participações · {question.commentCount} comentários{question.publish_at ? ` · ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(question.publish_at))}` : ''}</p></div>
        <div className="flex shrink-0 gap-2"><Button variant="outline" render={<Link href={`/admin/${question.id}`} />} className="font-hand">Editar</Button><QuestionActions id={question.id} status={question.status} /></div>
      </article>)}</div>}
  </main>
}
