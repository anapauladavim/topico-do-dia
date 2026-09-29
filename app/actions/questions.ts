'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdmin } from '@/lib/auth'
import { sanitizeText, LIMITS } from '@/lib/validation'
import type { QuestionStatus, ResponseType } from '@/lib/types'

export interface MutationResult {
  ok: boolean
  error?: string
  id?: string
}

const RESPONSE_TYPES: ResponseType[] = [
  'multiple_choice',
  'open',
  'multiple_custom',
]
const STATUSES: QuestionStatus[] = [
  'draft',
  'scheduled',
  'published',
  'closed',
  'archived',
]

interface OptionInput {
  id?: string
  label: string
}

function parseOptions(raw: FormDataEntryValue | null): OptionInput[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(String(raw))
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((o: { id?: string; label?: string }) => ({
        id: o.id,
        label: sanitizeText(o.label, LIMITS.optionLabel),
      }))
      .filter((o) => o.label.length > 0)
  } catch {
    return []
  }
}

function parseDate(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim()
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function revalidateAll(id?: string) {
  revalidatePath('/')
  revalidatePath('/arquivo')
  revalidatePath('/admin')
  if (id) revalidatePath(`/topico/${id}`)
}

async function guard(): Promise<boolean> {
  return isAdmin()
}

/** Ensure at most one published question by closing any others. */
async function enforceSingleActive(svc: ReturnType<typeof createServiceClient>, keepId: string) {
  await svc
    .from('questions')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('status', 'published')
    .neq('id', keepId)
}

export async function saveQuestion(formData: FormData): Promise<MutationResult> {
  if (!(await guard())) return { ok: false, error: 'Não autorizado.' }

  const id = formData.get('id') ? String(formData.get('id')) : null
  const question_text = sanitizeText(formData.get('question_text'), LIMITS.questionText)
  const response_type = String(formData.get('response_type')) as ResponseType
  const status = String(formData.get('status')) as QuestionStatus
  const limitRaw = Number(formData.get('open_response_char_limit'))
  const open_response_char_limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), LIMITS.openResponseMax)
      : 280
  const publish_at = parseDate(formData.get('publish_at'))
  const close_at = parseDate(formData.get('close_at'))
  const options = parseOptions(formData.get('options'))

  if (!question_text) return { ok: false, error: 'Escreva o texto da pergunta.' }
  if (!RESPONSE_TYPES.includes(response_type))
    return { ok: false, error: 'Tipo de resposta inválido.' }
  if (!STATUSES.includes(status)) return { ok: false, error: 'Status inválido.' }
  if (status === 'scheduled' && !publish_at)
    return { ok: false, error: 'Defina a data de publicação para agendar.' }
  if (publish_at && close_at && new Date(close_at) <= new Date(publish_at))
    return { ok: false, error: 'O encerramento deve ocorrer após a publicação.' }
  if (response_type !== 'open' && options.length < 2)
    return { ok: false, error: 'Adicione pelo menos duas opções de resposta.' }

  const svc = createServiceClient()
  const nowIso = new Date().toISOString()

  let questionId = id
  if (id) {
    const { data: existing } = await svc
      .from('questions')
      .select('status, response_type')
      .eq('id', id)
      .maybeSingle()
    if (!existing) return { ok: false, error: 'Pergunta não encontrada.' }
    // Option replacement would rewrite the historical meaning of recorded votes.
    if (
      ['published', 'closed', 'archived'].includes(existing.status) &&
      (existing.response_type !== response_type || response_type !== 'open')
    ) {
      return {
        ok: false,
        error: 'Para preservar os resultados, perguntas públicas não podem alterar tipo ou opções.',
      }
    }
    const { error } = await svc
      .from('questions')
      .update({
        question_text,
        response_type,
        status,
        open_response_char_limit,
        publish_at,
        close_at,
        updated_at: nowIso,
      })
      .eq('id', id)
    if (error) return { ok: false, error: 'Falha ao atualizar a pergunta.' }
  } else {
    const { data, error } = await svc
      .from('questions')
      .insert({
        question_text,
        response_type,
        status,
        open_response_char_limit,
        publish_at,
        close_at,
      })
      .select('id')
      .single()
    if (error || !data) return { ok: false, error: 'Falha ao criar a pergunta.' }
    questionId = data.id
  }

  if (!questionId) return { ok: false, error: 'Erro inesperado.' }

  // Replace options for choice-type questions.
  if (response_type !== 'open') {
    await svc.from('answer_options').delete().eq('question_id', questionId)
    const rows = options.map((o, i) => ({
      question_id: questionId,
      label: o.label,
      position: i,
    }))
    if (rows.length) {
      const { error } = await svc.from('answer_options').insert(rows)
      if (error) return { ok: false, error: 'Falha ao salvar as opções.' }
    }
  } else {
    await svc.from('answer_options').delete().eq('question_id', questionId)
  }

  if (status === 'published') await enforceSingleActive(svc, questionId)

  revalidateAll(questionId)
  return { ok: true, id: questionId }
}

export async function setQuestionStatus(
  id: string,
  status: QuestionStatus,
): Promise<MutationResult> {
  if (!(await guard())) return { ok: false, error: 'Não autorizado.' }
  if (!STATUSES.includes(status)) return { ok: false, error: 'Status inválido.' }

  const svc = createServiceClient()
  const { error } = await svc
    .from('questions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: 'Falha ao alterar o status.' }

  if (status === 'published') await enforceSingleActive(svc, id)

  revalidateAll(id)
  return { ok: true, id }
}

export async function duplicateQuestion(id: string): Promise<MutationResult> {
  if (!(await guard())) return { ok: false, error: 'Não autorizado.' }
  const svc = createServiceClient()

  const { data: q } = await svc.from('questions').select('*').eq('id', id).maybeSingle()
  if (!q) return { ok: false, error: 'Pergunta não encontrada.' }

  const { data: created, error } = await svc
    .from('questions')
    .insert({
      question_text: `${q.question_text} (cópia)`,
      response_type: q.response_type,
      status: 'draft',
      open_response_char_limit: q.open_response_char_limit,
      publish_at: null,
      close_at: null,
    })
    .select('id')
    .single()
  if (error || !created) return { ok: false, error: 'Falha ao duplicar.' }

  const { data: opts } = await svc
    .from('answer_options')
    .select('label, position')
    .eq('question_id', id)
    .order('position', { ascending: true })

  if (opts && opts.length) {
    await svc.from('answer_options').insert(
      opts.map((o) => ({
        question_id: created.id,
        label: o.label,
        position: o.position,
      })),
    )
  }

  revalidateAll()
  return { ok: true, id: created.id }
}

export async function deleteQuestion(id: string): Promise<MutationResult> {
  if (!(await guard())) return { ok: false, error: 'Não autorizado.' }
  const svc = createServiceClient()
  const { error } = await svc.from('questions').delete().eq('id', id)
  if (error) return { ok: false, error: 'Falha ao excluir a pergunta.' }
  revalidateAll(id)
  return { ok: true }
}

export async function deleteComment(
  commentId: string,
  questionId: string,
): Promise<MutationResult> {
  if (!(await guard())) return { ok: false, error: 'Não autorizado.' }
  const svc = createServiceClient()
  const { error } = await svc
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
  if (error) return { ok: false, error: 'Falha ao excluir o comentário.' }
  revalidateAll(questionId)
  return { ok: true }
}
