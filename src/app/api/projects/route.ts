import { createClient } from '@/lib/supabase/server'
import {
  requireAdmin,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'
import { resolveProjectThumbnail } from '@/lib/thumbnail'

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
      ),
      project_metadata (
        id,
        tech_stack,
        screenshots,
        status,
        github_stars,
        github_forks,
        github_language,
        github_topics,
        github_last_pushed_at,
        github_last_synced_at
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

// POST: 새 프로젝트 생성 (Admin 전용)
export async function POST(request: Request) {
  const supabase = await createClient()

  // Admin 인증 확인
  const authResult = await requireAdmin()
  if (authResult.error) return authResult.error

  // JSON 파싱
  const bodyResult = await parseJsonBody<{
    title?: string
    description?: string
    thumbnail_url?: string
    url?: string
    github_repo?: string
  }>(request)
  if (bodyResult.error) return bodyResult.error

  const { title, description, thumbnail_url, url, github_repo } = bodyResult.data

  if (!title?.trim()) {
    return apiError.badRequest('프로젝트 제목은 필수입니다')
  }

  // 썸네일 자동 생성 (입력값이 없고 URL/GitHub가 있는 경우)
  const finalThumbnail = await resolveProjectThumbnail(
    thumbnail_url,
    github_repo,
    url
  )

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: finalThumbnail,
      url: url?.trim() || null,
      github_repo: github_repo?.trim() || null,
      owner_id: authResult.user.id, // Admin UUID
    })
    .select()
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  // 메타데이터 레코드 자동 생성
  await supabase.from('project_metadata').insert({
    project_id: data.id,
  })

  return apiSuccess.created(data)
}
