import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  requireAuth,
  requireOwnership,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'

// PATCH: 댓글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const supabase = await createClient()

  // 인증 확인
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  // JSON 파싱
  const bodyResult = await parseJsonBody<{ content?: string }>(request)
  if (bodyResult.error) return bodyResult.error

  const { content } = bodyResult.data
  if (!content?.trim()) {
    return apiError.badRequest('댓글 내용을 입력해주세요')
  }

  // 본인 댓글인지 확인
  const ownershipResult = await requireOwnership('comments', commentId)
  if (ownershipResult.error) return ownershipResult.error

  const { data, error } = await supabase
    .from('comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select('*, profiles(display_name, avatar_url)')
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data)
}

// DELETE: 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const supabase = await createClient()

  // 인증 확인
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  // 본인 댓글인지 확인
  const ownershipResult = await requireOwnership('comments', commentId)
  if (ownershipResult.error) return ownershipResult.error

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.deleted()
}
