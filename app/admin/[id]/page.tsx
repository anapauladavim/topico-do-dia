import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getAdminQuestion } from '@/lib/admin-queries'
import Link from 'next/link'
import { QuestionEditor } from '@/components/admin/question-editor'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) { await requireAdmin(); const { id } = await params; const data = await getAdminQuestion(id); if (!data) notFound(); return <><div className="mx-auto max-w-3xl px-4 pt-6"><Button variant="outline" size="sm" render={<Link href={`/admin/${id}/export`} />} className="font-hand">Baixar CSV dos resultados</Button></div><QuestionEditor question={data.question} options={data.options} /></> }
