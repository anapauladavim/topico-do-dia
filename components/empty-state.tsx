import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function EmptyState() {
  return (
    <div className="paper-sheet mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-md border border-border p-10 text-center">
      <h2 className="font-hand text-2xl font-bold">
        Nenhum tópico ativo no momento
      </h2>
      <p className="max-w-md font-hand text-lg text-muted-foreground">
        A pergunta de hoje ainda não foi publicada. Enquanto isso, dê uma olhada
        nos tópicos anteriores.
      </p>
      <Button asChild className="mt-2 font-bold uppercase tracking-wide">
        <Link href="/arquivo">Ver o arquivo</Link>
      </Button>
    </div>
  )
}
