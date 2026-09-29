import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getAdminQuestion, getAdminResults } from '@/lib/admin-queries'

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return new NextResponse('Não autorizado', { status: 401 })
  }
  const { id } = await params
  const record = await getAdminQuestion(id)
  if (!record) return new NextResponse('Não encontrado', { status: 404 })

  const results = await getAdminResults(record.question)
  const rows = [
    ['pergunta', 'tipo', 'resposta', 'votos'],
    ...results.optionResults.map(({ option, count }) => [record.question.question_text, record.question.response_type, option.label, String(count)]),
    ...results.customAnswers.map(({ custom_answer, count }) => [record.question.question_text, record.question.response_type, custom_answer, String(count)]),
    ...results.openResponses.map(({ body }) => [record.question.question_text, record.question.response_type, body, '1']),
  ]
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="topico-${id}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
