import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Question } from '@/lib/types'
import { getAdminResults } from '@/lib/admin-queries'

function cell(v: string | number) { return `"${String(v).replaceAll('"', '""')}"` }
export async function GET(request: Request) {
  if (!(await isAdmin())) return new NextResponse('Não autorizado', { status: 401 })
  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from || !to || from > to) return new NextResponse('Período inválido', { status: 400 })
  const svc = createServiceClient()
  const start = new Date(`${from}T00:00:00-03:00`).toISOString()
  const end = new Date(`${to}T23:59:59.999-03:00`).toISOString()
  const { data } = await svc.from('questions').select('*').in('status', ['published','closed','archived']).gte('publish_at', start).lte('publish_at', end).order('publish_at', { ascending: true })
  const questions = (data as Question[]) ?? []
  const rows: (string | number)[][] = [['data','pergunta','tipo','resposta','votos','total_participacoes']]
  for (const q of questions) {
    const r = await getAdminResults(q)
    const date = (q.publish_at ?? q.created_at).slice(0,10)
    const total = q.response_type === 'open' ? r.openResponseCount : r.totalVotes
    for (const x of r.optionResults) rows.push([date,q.question_text,q.response_type,x.option.label,x.count,total])
    for (const x of r.customAnswers) rows.push([date,q.question_text,q.response_type,x.custom_answer,x.count,total])
    for (const x of r.openResponses) rows.push([date,q.question_text,q.response_type,x.body,1,total])
    if (r.optionResults.length + r.customAnswers.length + r.openResponses.length === 0) rows.push([date,q.question_text,q.response_type,'',0,total])
  }
  const csv='\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\n')+'\n'
  return new NextResponse(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="topicos-${from}-a-${to}.csv"`,'Cache-Control':'no-store'}})
}
