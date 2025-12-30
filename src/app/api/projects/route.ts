import { createClient } from '@/lib/supabase/server'
import {
  requireAuth,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'

// GET: 프로젝트 목록 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id (
        id,
        display_name,
        avatar_url
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // 특정 사용자의 프로젝트만 조회
  if (userId) {
    query = query.eq('owner_id', userId)
  }

  // 검색어로 필터링
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok({
    projects: data,
    total: count,
    limit,
    offset,
  })
}

// POST: 새 프로젝트 생성
export async function POST(request: Request) {
  const supabase = await createClient()

  // 인증 확인
  const authResult = await requireAuth(supabase)
  if (authResult.error) return authResult.error

  // JSON 파싱
  const bodyResult = await parseJsonBody<{ title?: string; description?: string; thumbnail_url?: string }>(request)
  if (bodyResult.error) return bodyResult.error

  const { title, description, thumbnail_url } = bodyResult.data

  if (!title?.trim()) {
    return apiError.badRequest('프로젝트 제목은 필수입니다')
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: thumbnail_url || null,
      owner_id: authResult.user.id,
    })
    .select()
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.created(data)
}
