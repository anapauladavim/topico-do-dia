import { requireAdmin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function ExportPage() {
  await requireAdmin()
  const today = new Date().toISOString().slice(0, 10)
  return <main className="mx-auto min-h-dvh max-w-xl px-4 py-10">
    <Link href="/admin" className="font-hand text-sm underline">← Voltar ao painel</Link>
    <section className="paper-sheet mt-6 border border-border p-6">
      <h1 className="font-hand text-3xl font-bold">Exportar resultados</h1>
      <p className="mt-2 font-hand text-muted-foreground">Escolha o período. O arquivo reúne os resultados consolidados dos tópicos publicados nesse intervalo.</p>
      <form action="/admin/export/csv" method="get" className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="font-hand">De<input required name="from" type="date" className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 font-sans" /></label>
        <label className="font-hand">Até<input required name="to" type="date" defaultValue={today} className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 font-sans" /></label>
        <Button type="submit" className="sm:col-span-2 font-hand">Baixar CSV consolidado</Button>
      </form>
    </section>
  </main>
}
