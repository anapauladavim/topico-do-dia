'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitVote } from '@/app/actions/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { AnswerOption, Question } from '@/lib/types'

const OTHER_VALUE = '__other__'

export function VoteForm({
  question,
  options,
}: {
  question: Question
  options: AnswerOption[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const [pending, startTransition] = useTransition()

  const allowCustom = question.response_type === 'multiple_custom'
  const isOther = selected === OTHER_VALUE

  function handleSubmit() {
    if (!selected) {
      toast.error('Selecione uma opção para votar.')
      return
    }
    if (isOther && custom.trim().length === 0) {
      toast.error('Escreva sua resposta.')
      return
    }

    const fd = new FormData()
    fd.set('questionId', question.id)
    if (isOther) {
      fd.set('customAnswer', custom.trim())
    } else {
      fd.set('optionId', selected)
    }

    startTransition(async () => {
      const res = await submitVote(fd)
      if (res.ok) {
        toast.success('Voto registrado! Obrigado por participar.')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Não foi possível votar.')
        if (res.error?.includes('já votou')) router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2.5" disabled={pending}>
        <legend className="sr-only">Opções de resposta</legend>
        {options.map((option) => (
          <OptionRow
            key={option.id}
            id={option.id}
            label={option.label}
            imageUrl={option.image_url}
            checked={selected === option.id}
            onSelect={() => setSelected(option.id)}
          />
        ))}
        {allowCustom && (
          <OptionRow
            id={OTHER_VALUE}
            label="Outra resposta..."
            checked={isOther}
            onSelect={() => setSelected(OTHER_VALUE)}
          />
        )}
      </fieldset>

      {allowCustom && isOther && (
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Escreva sua resposta"
          maxLength={200}
          className="font-hand text-base"
          disabled={pending}
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={pending}
        className="mt-1 w-full font-bold uppercase tracking-wide"
        size="lg"
      >
        {pending ? 'Enviando...' : 'Votar'}
      </Button>
    </div>
  )
}

function OptionRow({
  id,
  label,
  imageUrl,
  checked,
  onSelect,
}: {
  id: string
  label: string
  imageUrl?: string | null
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label
      htmlFor={`opt-${id}`}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md border-2 border-border bg-card px-4 py-3 transition-colors',
        checked
          ? 'border-primary bg-accent/60'
          : 'hover:border-primary/50 hover:bg-accent/30',
      )}
    >
      <input
        id={`opt-${id}`}
        type="radio"
        name="vote-option"
        className="sr-only"
        checked={checked}
        onChange={onSelect}
      />
      <span
        aria-hidden
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-foreground/70',
          checked && 'bg-primary',
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-primary-foreground">
            <path
              d="M3 8.5 L6.5 12 L13 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">{imageUrl && <img src={imageUrl} alt={label || 'Opção de voto'} className="max-h-72 w-full rounded-md object-contain" loading="lazy" />}<span className="font-hand text-lg leading-snug">{label}</span></span>
    </label>
  )
}
