import { VoteForm } from '@/components/vote-form'
import { OpenResponseForm } from '@/components/open-response-form'
import { TallyResults } from '@/components/tally-results'
import { OpenResponsesList } from '@/components/open-responses-list'
import { DateStamp } from '@/components/date-stamp'
import { Badge } from '@/components/ui/badge'
import { RESPONSE_TYPE_LABELS } from '@/lib/types'
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
    <article className="paper-sheet relative mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-md border border-border p-6 md:p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge
          variant="secondary"
          className="font-hand text-xs uppercase tracking-wide"
        >
          {RESPONSE_TYPE_LABELS[question.response_type]}
        </Badge>
        <h2 className="text-balance font-hand text-2xl font-bold leading-tight md:text-3xl">
          {question.question_text}
        </h2>
        <div className="ink-divider h-[2px] w-24 opacity-60" />
      </div>

      <div className="flex flex-col gap-4">
        {showForm ? (
          isOpenType ? (
            <OpenResponseForm question={question} />
          ) : (
            <VoteForm question={question} options={options} />
          )
        ) : (
          <div className="flex flex-col gap-4">
            {!votingOpen && (
              <p className="font-hand text-center text-sm text-muted-foreground">
                A votação está encerrada. Veja os resultados abaixo.
              </p>
            )}
            {hasResponded && votingOpen && (
              <p className="font-hand text-center text-sm text-muted-foreground">
                Você já participou. Obrigado! Veja o resultado parcial:
              </p>
            )}
            {isOpenType ? (
              <OpenResponsesList responses={results.openResponses} />
            ) : (
              <TallyResults results={results} animate />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end border-t border-dashed border-border pt-4">
        <DateStamp date={question.publish_at ?? question.created_at} />
      </div>
    </article>
  )
}
