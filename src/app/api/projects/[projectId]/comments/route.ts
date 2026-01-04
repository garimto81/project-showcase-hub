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

// POST: 댓글 생성 (익명 사용자 지원)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  // JSON 파싱
  const bodyResult = await parseJsonBody<{ content?: string; author_name?: string }>(request)
  if (bodyResult.error) return bodyResult.error

  const { content, author_name } = bodyResult.data
  if (!content?.trim()) {
    return apiError.badRequest('댓글 내용을 입력해주세요')
  }

  // 익명 사용자: author_name 필수
  if (!author_name?.trim()) {
    return apiError.badRequest('작성자 이름을 입력해주세요')
  }

  // 모든 사용자 익명으로 처리 (user_id = null)
  const { data, error } = await supabase
    .from('comments')
    .insert({
      project_id: projectId,
      user_id: null,
      content: content.trim(),
      author_name: author_name.trim(),
    })
    .select('*')
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.created(data)
}
