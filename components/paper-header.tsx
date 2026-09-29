import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PaperHeader({
  compact = false,
}: {
  compact?: boolean
}) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <Link href="/" className="group inline-block">
        <h1
          className={cn(
            'font-bold uppercase leading-none tracking-tight text-foreground transition-transform group-hover:-rotate-1',
            compact ? 'text-3xl md:text-4xl' : 'text-5xl md:text-6xl',
          )}
        >
          Tópico do Dia
        </h1>
      </Link>
      <div className="ink-divider h-[3px] w-40 opacity-70" />
      {!compact && (
        <nav className="flex items-center gap-5 font-hand text-lg">
          <Link href="/" className="underline-offset-4 hover:underline">
            Hoje
          </Link>
          <span aria-hidden className="text-muted-foreground">
            •
          </span>
          <Link href="/arquivo" className="underline-offset-4 hover:underline">
            Arquivo
          </Link>
        </nav>
      )}
    </header>
  )
}
