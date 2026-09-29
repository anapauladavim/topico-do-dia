import { cn } from '@/lib/utils'

interface TallyMarksProps {
  count: number
  className?: string
  animate?: boolean
}

const GROUP_W = 46
const H = 44

/**
 * Renders a number as hand-drawn tally marks: groups of five, each a set of
 * four vertical strokes crossed by a diagonal. Slight per-stroke jitter and
 * rotation give it an inked-by-hand feel.
 */
export function TallyMarks({ count, className, animate = false }: TallyMarksProps) {
  const safe = Math.max(0, Math.floor(count))
  const fullGroups = Math.floor(safe / 5)
  const remainder = safe % 5
  const groups: number[] = [
    ...Array.from({ length: fullGroups }, () => 5),
    ...(remainder > 0 ? [remainder] : []),
  ]

  if (safe === 0) {
    return (
      <span className={cn('font-hand text-muted-foreground text-sm', className)}>
        nenhum
      </span>
    )
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      {groups.map((n, gi) => (
        <TallyGroup key={gi} n={n} groupIndex={gi} animate={animate} />
      ))}
    </span>
  )
}

function TallyGroup({
  n,
  groupIndex,
  animate,
}: {
  n: number
  groupIndex: number
  animate: boolean
}) {
  // Vertical strokes with a bit of jitter.
  const jitters = [1.5, -1, 0.5, -1.5]
  const verticals = Math.min(n, 4)

  return (
    <svg
      width={GROUP_W}
      height={H}
      viewBox={`0 0 ${GROUP_W} ${H}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      {Array.from({ length: verticals }).map((_, i) => {
        const x = 7 + i * 9
        const j = jitters[i % jitters.length]
        const delay = animate ? (groupIndex * 5 + i) * 0.05 : 0
        return (
          <line
            key={i}
            x1={x + j * 0.3}
            y1={6}
            x2={x - j * 0.3}
            y2={H - 6}
            stroke="var(--ink)"
            strokeWidth={3}
            strokeLinecap="round"
            transform={`rotate(${j} ${x} ${H / 2})`}
            className={animate ? 'animate-tally' : undefined}
            style={animate ? { animationDelay: `${delay}s` } : undefined}
          />
        )
      })}
      {n === 5 && (
        <line
          x1={2}
          y1={H - 8}
          x2={GROUP_W - 8}
          y2={9}
          stroke="var(--ink)"
          strokeWidth={3}
          strokeLinecap="round"
          className={animate ? 'animate-tally' : undefined}
          style={animate ? { animationDelay: `${(groupIndex * 5 + 4) * 0.05}s` } : undefined}
        />
      )}
    </svg>
  )
}
