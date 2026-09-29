'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { saveQuestion } from '@/app/actions/questions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AnswerOption, Question, QuestionStatus, ResponseType } from '@/lib/types'

type EditableOption = { id?: string; label: string }
const localDate = (value: string | null | undefined) => value ? new Date(value).toISOString().slice(0, 16) : ''

export function QuestionEditor({ question, options = [] }: { question?: Question; options?: AnswerOption[] }) {
  const router = useRouter(); const [pending, startTransition] = useTransition()
  const [type, setType] = useState<ResponseType>(question?.response_type ?? 'multiple_choice')
  const [rows, setRows] = useState<EditableOption[]>(options.length ? options.map(({ id, label }) => ({ id, label })) : [{ label: '' }, { label: '' }])
  const choice = type !== 'open'
  function submit(formData: FormData) { formData.set('options', JSON.stringify(rows)); startTransition(async () => { const result = await saveQuestion(formData); if (!result.ok) return toast.error(result.error ?? 'Não foi possível salvar.'); toast.success('Pergunta salva.'); router.push(`/admin/${result.id}`); router.refresh() }) }
  return <main className="mx-auto min-h-dvh max-w-3xl px-4 py-8 md:py-12"><div className="mb-6"><Link href="/admin" className="font-hand text-sm underline-offset-4 hover:underline">← Voltar ao painel</Link><h1 className="mt-3 font-hand text-3xl font-bold">{question ? 'Editar pergunta' : 'Nova pergunta'}</h1></div>
    <form action={submit} className="paper-sheet flex flex-col gap-6 border border-border p-5 md:p-8"><input type="hidden" name="id" value={question?.id ?? ''} />
      <div className="grid gap-2"><Label htmlFor="question_text" className="font-hand text-base">Pergunta</Label><Textarea id="question_text" name="question_text" defaultValue={question?.question_text} maxLength={500} required className="min-h-24 font-hand text-lg" /></div>
      <div className="grid gap-2"><Label htmlFor="response_type" className="font-hand text-base">Tipo de resposta</Label><select id="response_type" name="response_type" value={type} onChange={e => setType(e.target.value as ResponseType)} className="h-10 border border-input bg-background px-3 font-hand"><option value="multiple_choice">Múltipla escolha</option><option value="multiple_custom">Múltipla escolha + outra resposta</option><option value="open">Resposta aberta</option></select></div>
      {choice && <fieldset className="grid gap-3"><legend className="font-hand text-base">Opções de resposta</legend>{rows.map((row, index) => <div className="flex gap-2" key={row.id ?? index}><Input aria-label={`Opção ${index + 1}`} value={row.label} maxLength={200} onChange={e => setRows(rows.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} className="font-hand" /> <Button type="button" variant="ghost" aria-label={`Remover opção ${index + 1}`} disabled={rows.length <= 2} onClick={() => setRows(rows.filter((_, i) => i !== index))}>×</Button></div>)}<Button type="button" variant="outline" className="w-fit font-hand" onClick={() => setRows([...rows, { label: '' }])}>+ Adicionar opção</Button></fieldset>}
      {type === 'open' && <div className="grid gap-2"><Label htmlFor="open_response_char_limit" className="font-hand text-base">Limite de caracteres</Label><Input id="open_response_char_limit" name="open_response_char_limit" type="number" min="1" max="2000" defaultValue={question?.open_response_char_limit ?? 280} /></div>}
      <div className="grid gap-5 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="status" className="font-hand text-base">Status</Label><select id="status" name="status" defaultValue={question?.status ?? 'draft'} className="h-10 border border-input bg-background px-3 font-hand">{(['draft','scheduled','published','closed','archived'] as QuestionStatus[]).map(status => <option key={status} value={status}>{({draft:'Rascunho',scheduled:'Agendada',published:'Publicada',closed:'Encerrada',archived:'Arquivada'} as Record<QuestionStatus,string>)[status]}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="publish_at" className="font-hand text-base">Publicar em</Label><Input id="publish_at" name="publish_at" type="datetime-local" defaultValue={localDate(question?.publish_at)} /></div><div className="grid gap-2"><Label htmlFor="close_at" className="font-hand text-base">Encerrar em</Label><Input id="close_at" name="close_at" type="datetime-local" defaultValue={localDate(question?.close_at)} /></div></div>
      <div className="flex justify-end gap-3 border-t border-dashed border-border pt-5"><Button type="button" variant="ghost" render={<Link href="/admin" />}>Cancelar</Button><Button type="submit" disabled={pending} className="font-hand">{pending ? 'Salvando…' : 'Salvar pergunta'}</Button></div>
    </form></main>
}
