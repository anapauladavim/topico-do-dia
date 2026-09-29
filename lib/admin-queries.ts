import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  AnswerOption,
  Comment,
  Question,
  QuestionResults,
} from '@/lib/types'

export interface AdminQuestionRow extends Question {
  responseCount: number
  commentCount: number
  optionCount: number
}

export async function listAllQuestions(): Promise<AdminQuestionRow[]> {
  const svc = createServiceClient()
  const { data: questions } = await svc
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (!questions) return []

  const rows = await Promise.all(
    (questions as Question[]).map(async (q) => {
      const [responseCount, commentCount, optionCount] = await Promise.all([
        countResponses(svc, q),
        countComments(svc, q.id),
        countOptions(svc, q.id),
      ])
      return { ...q, responseCount, commentCount, optionCount }
    }),
  )
  return rows
}

async function countResponses(
  svc: ReturnType<typeof createServiceClient>,
  q: Question,
): Promise<number> {
  const table = q.response_type === 'open' ? 'open_responses' : 'votes'
  const { count } = await svc
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('question_id', q.id)
  return count ?? 0
}

async function countComments(
  svc: ReturnType<typeof createServiceClient>,
  questionId: string,
): Promise<number> {
  const { count } = await svc
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId)
    .eq('is_deleted', false)
  return count ?? 0
}

async function countOptions(
  svc: ReturnType<typeof createServiceClient>,
  questionId: string,
): Promise<number> {
  const { count } = await svc
    .from('answer_options')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId)
  return count ?? 0
}

export async function getAdminQuestion(
  id: string,
): Promise<{ question: Question; options: AnswerOption[] } | null> {
  const svc = createServiceClient()
  const { data } = await svc.from('questions').select('*').eq('id', id).maybeSingle()
  if (!data) return null
  const { data: options } = await svc
    .from('answer_options')
    .select('*')
    .eq('question_id', id)
    .order('position', { ascending: true })
  return {
    question: data as Question,
    options: (options as AnswerOption[]) ?? [],
  }
}

export async function getAdminResults(q: Question): Promise<QuestionResults> {
  const svc = createServiceClient()
  const { data: options } = await svc
    .from('answer_options')
    .select('*')
    .eq('question_id', q.id)
    .order('position', { ascending: true })
  const opts = (options as AnswerOption[]) ?? []

  const { data: votes } = await svc
    .from('votes')
    .select('option_id, custom_answer')
    .eq('question_id', q.id)
  const voteRows =
    (votes as { option_id: string | null; custom_answer: string | null }[]) ?? []

  const optionResults = opts.map((option) => ({
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

  const { data: openData } = await svc
    .from('open_responses')
    .select('*')
    .eq('question_id', q.id)
    .order('created_at', { ascending: false })
  const openResponses = openData ?? []

  return {
    optionResults,
    customAnswers,
    totalVotes: voteRows.length,
    openResponses,
    openResponseCount: openResponses.length,
  }
}

export async function getAdminComments(questionId: string): Promise<Comment[]> {
  const svc = createServiceClient()
  const { data } = await svc
    .from('comments')
    .select('*')
    .eq('question_id', questionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  return (data as Comment[]) ?? []
}
