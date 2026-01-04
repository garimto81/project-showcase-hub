import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
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

  // 현재 사용자 정보 가져오기 (익명 허용)
  const user = await getAuthUser()

  // JSON 파싱
  const bodyResult = await parseJsonBody<{ content?: string; author_name?: string }>(request)
  if (bodyResult.error) return bodyResult.error

  const { content, author_name } = bodyResult.data
  if (!content?.trim()) {
    return apiError.badRequest('댓글 내용을 입력해주세요')
  }

  // 사용자 ID 및 작성자 이름 설정
  let userId: string | null = null
  let authorName: string | null = null

  if (user.role === 'anonymous') {
    // 익명 사용자: Anonymous UUID 사용, author_name 필수
    if (!author_name?.trim()) {
      return apiError.badRequest('작성자 이름을 입력해주세요')
    }
    userId = user.id
    authorName = author_name.trim()
  } else {
    // 로그인 사용자: user_id 사용, author_name은 선택
    userId = user.id
    authorName = author_name?.trim() || null
  }

  // 댓글 생성
  const { data, error } = await supabase
    .from('comments')
    .insert({
      project_id: projectId,
      user_id: userId,
      content: content.trim(),
      author_name: authorName,
    })
    .select('*')
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.created(data)
}
