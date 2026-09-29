import { TallyMarks } from '@/components/tally-marks'
import type { QuestionResults } from '@/lib/types'

export function TallyResults({
  results,
  animate = false,
}: {
  results: QuestionResults
  animate?: boolean
}) {
  const { optionResults, customAnswers, totalVotes } = results

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {optionResults.map(({ option, count }) => (
          <li key={option.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-hand text-lg leading-snug">{option.label}</span>
              <span className="font-hand text-base text-muted-foreground">
                {count}
              </span>
            </div>
            <TallyMarks count={count} animate={animate} />
          </li>
        ))}
      </ul>

      {customAnswers.length > 0 && (
        <div className="flex flex-col gap-3 border-t-2 border-dashed border-border pt-3">
          <p className="font-hand text-base text-muted-foreground">
            Outras respostas
          </p>
          <ul className="flex flex-col gap-3">
            {customAnswers.map((c) => (
              <li key={c.custom_answer} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-hand text-lg leading-snug">
                    {c.custom_answer}
                  </span>
                  <span className="font-hand text-base text-muted-foreground">
                    {c.count}
                  </span>
                </div>
                <TallyMarks count={c.count} animate={animate} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-1 font-hand text-sm text-muted-foreground">
        Total de votos: {totalVotes}
      </p>
    </div>
  )
}
