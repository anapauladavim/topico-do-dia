import { requireAdmin } from '@/lib/auth'
import { QuestionEditor } from '@/components/admin/question-editor'

export default async function NewQuestionPage() { await requireAdmin(); return <QuestionEditor /> }
