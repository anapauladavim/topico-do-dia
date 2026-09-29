'use server'

import { getComments, type CommentsPage } from '@/lib/queries'

const PAGE_SIZE = 10

export async function loadComments(
  questionId: string,
  offset: number,
): Promise<CommentsPage> {
  return getComments(questionId, PAGE_SIZE, offset)
}
