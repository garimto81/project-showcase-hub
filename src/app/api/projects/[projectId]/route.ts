import { createClient } from '@/lib/supabase/server'
import {
  requireAdmin,
  requireOwnership,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'
import { resolveProjectThumbnail } from '@/lib/thumbnail'

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

// PATCH: 프로젝트 수정 (Admin 전용)
export async function PATCH(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const supabase = await createClient()

  // Admin 인증 확인
  const authResult = await requireAdmin()
  if (authResult.error) return authResult.error

  // 소유자 확인
  const ownershipResult = await requireOwnership('projects', projectId, authResult.user.id)
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
  if (url !== undefined) updateData.url = url?.trim() || null
  if (github_repo !== undefined) updateData.github_repo = github_repo?.trim() || null

  // 썸네일 처리:
  // 1. 명시적으로 thumbnail_url이 전달되면 그 값 사용
  // 2. URL/GitHub가 변경되고 썸네일이 전달되지 않으면 자동 생성
  if (thumbnail_url !== undefined) {
    updateData.thumbnail_url = thumbnail_url || null
  } else if (url !== undefined || github_repo !== undefined) {
    // URL이나 GitHub가 변경되면 새 썸네일 자동 생성 시도
    const newUrl = url !== undefined ? url?.trim() : undefined
    const newGithub = github_repo !== undefined ? github_repo?.trim() : undefined

    // 기존 프로젝트 정보 조회
    const { data: currentProject } = await supabase
      .from('projects')
      .select('url, github_repo, thumbnail_url')
      .eq('id', projectId)
      .single()

    // 기존 썸네일이 없거나 URL/GitHub가 변경된 경우에만 자동 생성
    const finalUrl = newUrl ?? currentProject?.url
    const finalGithub = newGithub ?? currentProject?.github_repo

    if (!currentProject?.thumbnail_url || newUrl || newGithub) {
      const autoThumbnail = await resolveProjectThumbnail(null, finalGithub, finalUrl)
      if (autoThumbnail) {
        updateData.thumbnail_url = autoThumbnail
      }
    }
  }

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

// DELETE: 프로젝트 삭제 (Admin 전용)
export async function DELETE(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const supabase = await createClient()

  // Admin 인증 확인
  const authResult = await requireAdmin()
  if (authResult.error) return authResult.error

  // 소유자 확인
  const ownershipResult = await requireOwnership('projects', projectId, authResult.user.id)
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
