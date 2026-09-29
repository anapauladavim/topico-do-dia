import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getAdminQuestion } from '@/lib/admin-queries'
import Link from 'next/link'
import { QuestionEditor } from '@/components/admin/question-editor'
import { Button } from '@/components/ui/button'
import { TallyResults } from '@/components/tally-results'
import { OpenResponsesList } from '@/components/open-responses-list'
import { CommentModeration } from '@/components/admin/comment-moderation'
import { getAdminComments, getAdminResults } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'
export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) { await requireAdmin(); const { id } = await params; const data = await getAdminQuestion(id); if (!data) notFound(); const [results, comments] = await Promise.all([getAdminResults(data.question), getAdminComments(id)]); const open = data.question.response_type === 'open'; return <><div className="mx-auto max-w-3xl px-4 pt-6"><Button variant="outline" size="sm" render={<Link href={`/admin/${id}/export`} />} className="font-hand">Baixar CSV dos resultados</Button></div><QuestionEditor question={data.question} options={data.options} /><main className="mx-auto max-w-3xl px-4 pb-12"><section className="paper-sheet border border-border p-5"><h2 className="font-hand text-2xl font-bold">Resultados</h2><p className="mb-4 font-hand text-sm text-muted-foreground">{open ? results.openResponseCount : results.totalVotes} participações registradas</p>{open ? <OpenResponsesList responses={results.openResponses} /> : <TallyResults results={results} />}</section><CommentModeration questionId={id} comments={comments} /></main></> }
