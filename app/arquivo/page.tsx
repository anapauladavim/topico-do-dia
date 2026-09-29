import Link from 'next/link'
import { PaperHeader } from '@/components/paper-header'
import { DateStamp } from '@/components/date-stamp'
import { Badge } from '@/components/ui/badge'
import { getArchiveQuestions } from '@/lib/queries'
import { RESPONSE_TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-0', '-rotate-2', 'rotate-2']

export default async function ArquivoPage() {
  const questions = await getArchiveQuestions()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 py-10 md:py-14">
      <PaperHeader />

      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-hand text-3xl font-bold -rotate-1">Arquivo</h2>
          <p className="font-hand text-lg text-muted-foreground">
            Todos os tópicos já publicados.
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="text-center font-hand text-lg text-muted-foreground">
            Ainda não há tópicos no arquivo.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {questions.map((q, i) => (
              <li key={q.id}>
                <Link
                  href={`/topico/${q.id}`}
                  className={cn(
                    'paper-sheet flex h-full flex-col gap-3 rounded-md border border-border p-5 transition-transform hover:-translate-y-1',
                    ROTATIONS[i % ROTATIONS.length],
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-hand text-[10px] uppercase"
                    >
                      {RESPONSE_TYPE_LABELS[q.response_type]}
                    </Badge>
                    {q.status !== 'published' && (
                      <Badge
                        variant="outline"
                        className="font-hand text-[10px] uppercase"
                      >
                        {STATUS_LABELS[q.status]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-balance font-hand text-xl font-bold leading-tight">
                    {q.question_text}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-hand text-sm text-muted-foreground">
                      {q.total} resposta{q.total === 1 ? '' : 's'}
                    </span>
                    <DateStamp date={q.publish_at ?? q.created_at} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
