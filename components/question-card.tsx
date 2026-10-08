import { VoteForm } from '@/components/vote-form'
import { OpenResponseForm } from '@/components/open-response-form'
import { TallyResults } from '@/components/tally-results'
import { OpenResponsesList } from '@/components/open-responses-list'
import { DateStamp } from '@/components/date-stamp'
import type { AnswerOption, Question, QuestionResults } from '@/lib/types'

export function QuestionCard({
  question,
  options,
  results,
  hasResponded,
  votingOpen,
}: {
  question: Question
  options: AnswerOption[]
  results: QuestionResults
  hasResponded: boolean
  votingOpen: boolean
}) {
  const isOpenType = question.response_type === 'open'
  const showForm = votingOpen && !hasResponded

  return (
    <article className="paper-sheet wall-paper relative mx-auto flex w-full max-w-2xl flex-col gap-6 border border-border p-6 md:p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-balance font-hand text-2xl font-bold leading-tight md:text-3xl">
          {question.question_text}
        </h2>
        <div className="ink-divider h-[2px] w-24 opacity-60" />
      </div>

      {showForm && (
        <div className="flex flex-col gap-4">
          {isOpenType ? (
            <OpenResponseForm question={question} />
          ) : (
            <VoteForm question={question} options={options} />
          )}
        </div>
      )}

      <div className={showForm ? 'border-t-2 border-dashed border-border pt-5' : ''}>
        {hasResponded && votingOpen && (
          <p className="mb-3 text-center font-hand text-sm text-muted-foreground">
            Você já participou. Obrigado! Veja o resultado parcial:
          </p>
        )}
        {!votingOpen && (
          <p className="mb-3 text-center font-hand text-sm text-muted-foreground">
            A votação está encerrada. Resultado final:
          </p>
        )}
        {showForm && (
          <p className="mb-3 text-center font-hand text-sm font-bold">
            Resultado parcial
          </p>
        )}
        {isOpenType ? (
          <OpenResponsesList responses={results.openResponses} />
        ) : (
          <TallyResults results={results} animate={hasResponded || !votingOpen} />
        )}
      </div>

      <div className="flex items-center justify-end border-t border-dashed border-border pt-4">
        <DateStamp date={question.publish_at ?? question.created_at} />
      </div>
    </article>
  )
}
