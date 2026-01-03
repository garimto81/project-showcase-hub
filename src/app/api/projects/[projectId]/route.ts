import { createClient } from '@/lib/supabase/server'
import {
  requireAuth,
  requireOwnership,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

// GET: 프로젝트 상세 조회
export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
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
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return apiError.notFound('프로젝트를 찾을 수 없습니다')
    }
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data)
}

// PATCH: 프로젝트 수정
export async function PATCH(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const supabase = await createClient()

  // 인증 확인
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  // 소유자 확인
  const ownershipResult = await requireOwnership('projects', projectId)
  if (ownershipResult.error) return ownershipResult.error

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

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title.trim()
  if (description !== undefined) updateData.description = description?.trim() || null
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url || null
  if (url !== undefined) updateData.url = url?.trim() || null
  if (github_repo !== undefined) updateData.github_repo = github_repo?.trim() || null

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data)
}

// DELETE: 프로젝트 삭제
export async function DELETE(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const supabase = await createClient()

  // 인증 확인
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  // 소유자 확인
  const ownershipResult = await requireOwnership('projects', projectId)
  if (ownershipResult.error) return ownershipResult.error

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.deleted()
}
