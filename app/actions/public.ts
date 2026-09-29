'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { ensureParticipantId } from '@/lib/participant'
import { sanitizeText, sanitizeMultiline, LIMITS } from '@/lib/validation'
import type { Question } from '@/lib/types'

export interface ActionResult {
  ok: boolean
  error?: string
}

function isOpenForVoting(q: Question): boolean {
  if (q.status !== 'published') return false
  if (q.close_at && new Date(q.close_at).getTime() <= Date.now()) return false
  return true
}

async function loadQuestion(id: string): Promise<Question | null> {
  const svc = createServiceClient()
  const { data } = await svc.from('questions').select('*').eq('id', id).maybeSingle()
  return (data as Question) ?? null
}

function revalidateQuestion(id: string) {
  revalidatePath('/')
  revalidatePath('/arquivo')
  revalidatePath(`/topico/${id}`)
}

export async function submitVote(formData: FormData): Promise<ActionResult> {
  const questionId = String(formData.get('questionId') ?? '')
  const optionId = formData.get('optionId') ? String(formData.get('optionId')) : null
  const rawCustom = formData.get('customAnswer')

  const q = await loadQuestion(questionId)
  if (!q) return { ok: false, error: 'Pergunta não encontrada.' }
  if (q.response_type === 'open') {
    return { ok: false, error: 'Esta pergunta é de resposta aberta.' }
  }
  if (!isOpenForVoting(q)) {
    return { ok: false, error: 'A votação desta pergunta está encerrada.' }
  }

  const svc = createServiceClient()
  let finalOptionId: string | null = null
  let customAnswer: string | null = null

  if (optionId) {
    // Validate the option belongs to this question.
    const { data: opt } = await svc
      .from('answer_options')
      .select('id')
      .eq('id', optionId)
      .eq('question_id', questionId)
      .maybeSingle()
    if (!opt) return { ok: false, error: 'Opção inválida.' }
    finalOptionId = optionId
  } else if (q.response_type === 'multiple_custom' && rawCustom) {
    customAnswer = sanitizeText(rawCustom, LIMITS.optionLabel)
    if (!customAnswer) return { ok: false, error: 'Escreva uma resposta.' }
  } else {
    return { ok: false, error: 'Selecione uma opção.' }
  }

  const participantId = await ensureParticipantId()

  const { error } = await svc.from('votes').insert({
    question_id: questionId,
    option_id: finalOptionId,
    custom_answer: customAnswer,
    participant_id: participantId,
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Você já votou nesta pergunta.' }
    }
    return { ok: false, error: 'Não foi possível registrar seu voto.' }
  }

  revalidateQuestion(questionId)
  return { ok: true }
}

export async function submitOpenResponse(formData: FormData): Promise<ActionResult> {
  const questionId = String(formData.get('questionId') ?? '')
  const q = await loadQuestion(questionId)
  if (!q) return { ok: false, error: 'Pergunta não encontrada.' }
  if (q.response_type !== 'open') {
    return { ok: false, error: 'Esta pergunta não aceita resposta aberta.' }
  }
  if (!isOpenForVoting(q)) {
    return { ok: false, error: 'As respostas desta pergunta estão encerradas.' }
  }

  const limit = Math.min(q.open_response_char_limit || 280, LIMITS.openResponseMax)
  const body = sanitizeMultiline(formData.get('body'), limit)
  if (!body) return { ok: false, error: 'Escreva uma resposta.' }

  const participantId = await ensureParticipantId()
  const svc = createServiceClient()
  const { error } = await svc.from('open_responses').insert({
    question_id: questionId,
    participant_id: participantId,
    body,
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Você já respondeu esta pergunta.' }
    }
    return { ok: false, error: 'Não foi possível registrar sua resposta.' }
  }

  revalidateQuestion(questionId)
  return { ok: true }
}

const URL_RE = /https?:\/\//gi

export async function submitComment(formData: FormData): Promise<ActionResult> {
  const questionId = String(formData.get('questionId') ?? '')
  const q = await loadQuestion(questionId)
  if (!q) return { ok: false, error: 'Pergunta não encontrada.' }
  // Comments are allowed on any publicly visible question, including archived.
  if (!['published', 'closed', 'archived'].includes(q.status)) {
    return { ok: false, error: 'Comentários indisponíveis para esta pergunta.' }
  }

  const nickname = sanitizeText(formData.get('nickname'), LIMITS.nickname)
  const body = sanitizeMultiline(formData.get('body'), LIMITS.comment)
  if (!nickname) return { ok: false, error: 'Informe um apelido.' }
  if (nickname.length < 2) return { ok: false, error: 'Apelido muito curto.' }
  if (!body) return { ok: false, error: 'Escreva um comentário.' }
  if (body.length < 2) return { ok: false, error: 'Comentário muito curto.' }

  // Basic spam protection: too many links.
  const links = body.match(URL_RE)?.length ?? 0
  if (links > 2) return { ok: false, error: 'Comentário com excesso de links.' }

  const participantId = await ensureParticipantId()
  const svc = createServiceClient()

  // Throttle: reject a second comment within 15s from the same participant.
  const { data: recent } = await svc
    .from('comments')
    .select('created_at')
    .eq('question_id', questionId)
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (recent && Date.now() - new Date(recent.created_at).getTime() < 15000) {
    return { ok: false, error: 'Aguarde alguns segundos antes de comentar novamente.' }
  }

  const { error } = await svc.from('comments').insert({
    question_id: questionId,
    participant_id: participantId,
    nickname,
    body,
  })
  if (error) return { ok: false, error: 'Não foi possível publicar o comentário.' }

  revalidateQuestion(questionId)
  return { ok: true }
}
