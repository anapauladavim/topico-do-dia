import { PaperHeader } from '@/components/paper-header'
import { QuestionCard } from '@/components/question-card'
import { CommentsSection } from '@/components/comments-section'
import { EmptyState } from '@/components/empty-state'
import {
  getActiveQuestion,
  getOptions,
  getResults,
  getComments,
  hasParticipantResponded,
} from '@/lib/queries'
import { getParticipantId } from '@/lib/participant'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const question = await getActiveQuestion()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 py-10 md:py-14">
      <PaperHeader />

      {question ? (
        <div className="flex flex-col gap-10">
          {await renderQuestion(question.id)}
        </div>
      ) : (
        <EmptyState />
      )}

      <footer className="mt-auto pt-6 text-center font-hand text-sm text-muted-foreground">
        Tópico do Dia — uma pergunta por dia, uma conversa de cada vez.
      </footer>
    </main>
  )
}

async function renderQuestion(questionId: string) {
  const question = await getActiveQuestion()
  if (!question || question.id !== questionId) return null

  const [options, results, participantId, commentsPage] = await Promise.all([
    getOptions(question.id),
    getResults(question),
    getParticipantId(),
    getComments(question.id, 10, 0),
  ])
  const hasResponded = await hasParticipantResponded(question, participantId)
  const votingOpen = question.status === 'published'

  return (
    <>
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
    </>
  )
}
