import { cn } from '@/lib/utils'
import type { OpenResponse } from '@/lib/types'

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0']

export function OpenResponsesList({
  responses,
}: {
  responses: OpenResponse[]
}) {
  if (responses.length === 0) {
    return (
      <p className="font-hand text-muted-foreground">
        Nenhuma resposta ainda. Seja o primeiro!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-hand text-sm text-muted-foreground">
        {responses.length} resposta{responses.length === 1 ? '' : 's'}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {responses.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              'paper-sheet rounded-md border border-border p-3 font-hand text-base leading-relaxed',
              ROTATIONS[i % ROTATIONS.length],
            )}
          >
            {r.body}
          </li>
        ))}
      </ul>
    </div>
  )
}
