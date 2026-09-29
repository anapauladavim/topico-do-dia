import { cn } from '@/lib/utils'

function formatStamp(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(d.getUTCFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

export function DateStamp({
  date,
  className,
}: {
  date: string | null
  className?: string
}) {
  if (!date) return null
  return (
    <p className={cn('font-hand text-sm text-muted-foreground', className)}>
      Data: {formatStamp(date)}
    </p>
  )
}
