import Link from 'next/link'
import { PaperHeader } from '@/components/paper-header'
import { DateStamp } from '@/components/date-stamp'
import { TallyResults } from '@/components/tally-results'
import { OpenResponsesList } from '@/components/open-responses-list'
import { getArchiveQuestions, getResults } from '@/lib/queries'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-0', '-rotate-2', 'rotate-2']

export default async function ArquivoPage() {
  const questions = await getArchiveQuestions()
  const items = await Promise.all(questions.map(async (q) => ({ question: q, results: await getResults(q) })))

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 py-10 md:py-14">
      <PaperHeader />
      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-hand text-3xl font-bold -rotate-1">Arquivo</h2>
          <p className="font-hand text-lg text-muted-foreground">Tópicos passados e seus resultados finais.</p>
        </div>
        {items.length === 0 ? <p className="text-center font-hand text-lg text-muted-foreground">Ainda não há tópicos no arquivo.</p> :
          <ul className="flex flex-col gap-5">
            {items.map(({ question: q, results }, i) => (
              <li key={q.id} className={cn('paper-sheet border border-border p-5', ROTATIONS[i % ROTATIONS.length])}>
                <Link href={`/topico/${q.id}`} className="block">
                  <p className="text-balance font-hand text-xl font-bold leading-tight">{q.question_text}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-hand text-sm text-muted-foreground">{q.total} resposta{q.total === 1 ? '' : 's'}</span>
                    <DateStamp date={q.publish_at ?? q.created_at} />
                  </div>
                </Link>
                <div className="mt-4 border-t border-dashed border-border pt-4">
                  {q.response_type === 'open' ? <OpenResponsesList responses={results.openResponses} /> : <TallyResults results={results} />}
                </div>
              </li>
            ))}
          </ul>}
      </section>
    </main>
  )
}
