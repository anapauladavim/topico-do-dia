import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  AnswerOption,
  Comment,
  OpenResponse,
  Question,
  QuestionResults,
} from '@/lib/types'
import { PUBLIC_STATUSES } from '@/lib/types'

/**
 * Promote scheduled questions whose time has come, and close published ones
 * past their close time. Runs with the service role so it can mutate status.
 * Idempotent and cheap enough to call on public page loads.
 */
export async function syncSchedules(): Promise<void> {
  const svc = createServiceClient()
  const nowIso = new Date().toISOString()

  await svc
    .from('questions')
    .update({ status: 'closed', updated_at: nowIso })
    .eq('status', 'published')
    .not('close_at', 'is', null)
    .lte('close_at', nowIso)

  // A schedule must never create two simultaneous topics. Only promote the
  // oldest due question when there is no currently open published question.
  const { data: active } = await svc
    .from('questions')
    .select('id')
    .eq('status', 'published')
    .or(`close_at.is.null,close_at.gt.${nowIso}`)
    .limit(1)
    .maybeSingle()
  if (active) return

  const { data: next } = await svc
    .from('questions')
    .select('id')
    .eq('status', 'scheduled')
    .not('publish_at', 'is', null)
    .lte('publish_at', nowIso)
    .order('publish_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (next) {
    await svc
      .from('questions')
      .update({ status: 'published', updated_at: nowIso })
      .eq('id', next.id)
  }
}

export async function getActiveQuestion(): Promise<Question | null> {
  await syncSchedules()
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'published')
    .or(`close_at.is.null,close_at.gt.${nowIso}`)
    .order('publish_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Question) ?? null
}

export async function getPublicQuestion(id: string): Promise<Question | null> {
  await syncSchedules()
  const supabase = await createClient()
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .in('status', PUBLIC_STATUSES)
    .maybeSingle()
  return (data as Question) ?? null
}

export async function getArchiveQuestions(): Promise<
  (Question & { total: number })[]
> {
  await syncSchedules()
  const supabase = await createClient()
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .in('status', PUBLIC_STATUSES)
    .order('publish_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (!questions) return []

  const results = await Promise.all(
    (questions as Question[]).map(async (q) => {
      const total = await getResponseCount(q)
      return { ...q, total }
    }),
  )
  return results
}

async function getResponseCount(q: Question): Promise<number> {
  const supabase = await createClient()
  if (q.response_type === 'open') {
    const { count } = await supabase
      .from('open_responses')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', q.id)
    return count ?? 0
  }
  const { count } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', q.id)
  return count ?? 0
}

export async function getOptions(questionId: string): Promise<AnswerOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('answer_options')
    .select('*')
    .eq('question_id', questionId)
    .order('position', { ascending: true })
  return (data as AnswerOption[]) ?? []
}

export async function getResults(q: Question): Promise<QuestionResults> {
  const supabase = await createClient()
  const options = await getOptions(q.id)

  const { data: votes } = await supabase
    .from('votes')
    .select('option_id, custom_answer')
    .eq('question_id', q.id)

  const voteRows = (votes as { option_id: string | null; custom_answer: string | null }[]) ?? []

  const optionResults = options.map((option) => ({
    option,
    count: voteRows.filter((v) => v.option_id === option.id).length,
  }))

  const customMap = new Map<string, number>()
  for (const v of voteRows) {
    if (!v.option_id && v.custom_answer) {
      customMap.set(v.custom_answer, (customMap.get(v.custom_answer) ?? 0) + 1)
    }
  }
  const customAnswers = Array.from(customMap.entries())
    .map(([custom_answer, count]) => ({ custom_answer, count }))
    .sort((a, b) => b.count - a.count)

  const { data: openData } = await supabase
    .from('open_responses')
    .select('*')
    .eq('question_id', q.id)
    .order('created_at', { ascending: false })
  const openResponses = (openData as OpenResponse[]) ?? []

  return {
    optionResults,
    customAnswers,
    totalVotes: voteRows.length,
    openResponses,
    openResponseCount: openResponses.length,
  }
}

export interface CommentsPage {
  comments: Comment[]
  total: number
  hasMore: boolean
}

export async function getComments(
  questionId: string,
  limit = 10,
  offset = 0,
): Promise<CommentsPage> {
  const supabase = await createClient()
  const { data, count } = await supabase
    .from('comments')
    .select('*', { count: 'exact' })
    .eq('question_id', questionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const comments = (data as Comment[]) ?? []
  const total = count ?? 0
  return { comments, total, hasMore: offset + comments.length < total }
}

/** Whether this participant already answered the question. */
export async function hasParticipantResponded(
  q: Question,
  participantId: string | null,
): Promise<boolean> {
  if (!participantId) return false
  const supabase = await createClient()
  const table = q.response_type === 'open' ? 'open_responses' : 'votes'
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('question_id', q.id)
    .eq('participant_id', participantId)
  return (count ?? 0) > 0
}
