import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PaperHeader } from '@/components/paper-header'
import { QuestionCard } from '@/components/question-card'
import { CommentsSection } from '@/components/comments-section'
import {
  getPublicQuestion,
  getOptions,
  getResults,
  getComments,
  hasParticipantResponded,
} from '@/lib/queries'
import { getParticipantId } from '@/lib/participant'

export const dynamic = 'force-dynamic'

export default async function TopicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const question = await getPublicQuestion(id)
  if (!question) notFound()

  const [options, results, participantId, commentsPage] = await Promise.all([
    getOptions(question.id),
    getResults(question),
    getParticipantId(),
    getComments(question.id, 10, 0),
  ])
  const hasResponded = await hasParticipantResponded(question, participantId)
  const votingOpen = question.status === 'published'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 py-10 md:py-14">
      <PaperHeader compact />

      <div className="flex justify-center">
        <Link
          href="/arquivo"
          className="font-hand text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Voltar ao arquivo
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <QuestionCard
          question={question}
          options={options}
          results={results}
          hasResponded={hasResponded}
          votingOpen={votingOpen}
        />
        <CommentsSection
          questionId={question.id}
          initialComments={commentsPage.comments}
          initialTotal={commentsPage.total}
          initialHasMore={commentsPage.hasMore}
        />
      </div>
    </main>
  )
}
