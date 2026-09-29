export type QuestionStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'closed'
  | 'archived'

export type ResponseType = 'multiple_choice' | 'open' | 'multiple_custom'

export interface AnswerOption {
  id: string
  question_id: string
  label: string
  position: number
  created_at: string
}

export interface Question {
  id: string
  question_text: string
  response_type: ResponseType
  status: QuestionStatus
  open_response_char_limit: number
  publish_at: string | null
  close_at: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  question_id: string
  participant_id: string
  nickname: string
  body: string
  is_deleted: boolean
  created_at: string
}

export interface OpenResponse {
  id: string
  question_id: string
  participant_id: string
  body: string
  created_at: string
}

export interface OptionResult {
  option: AnswerOption
  count: number
}

export interface QuestionResults {
  optionResults: OptionResult[]
  customAnswers: { custom_answer: string; count: number }[]
  totalVotes: number
  openResponses: OpenResponse[]
  openResponseCount: number
}

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  multiple_choice: 'Múltipla escolha',
  open: 'Resposta aberta',
  multiple_custom: 'Múltipla escolha + resposta livre',
}

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  published: 'Publicada',
  closed: 'Encerrada',
  archived: 'Arquivada',
}

/** Statuses that the public may read. */
export const PUBLIC_STATUSES: QuestionStatus[] = [
  'published',
  'closed',
  'archived',
]
