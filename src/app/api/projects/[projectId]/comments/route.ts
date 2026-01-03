import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  requireAuth,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'

// GET: 프로젝트 댓글 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(display_name, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data || [])
}

// POST: 댓글 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
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

  const { data, error } = await supabase
    .from('comments')
    .insert({
      project_id: projectId,
      user_id: authResult.user.id,
      content: content.trim(),
    })
    .select('*, profiles(display_name, avatar_url)')
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.created(data)
}
