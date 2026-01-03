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
  const authResult = await requireAuth(supabase)
  if (authResult.error) return authResult.error

  // 소유자 확인
  const ownershipResult = await requireOwnership(supabase, 'projects', projectId, authResult.user.id)
  if (ownershipResult.error) return ownershipResult.error

  // JSON 파싱
  const bodyResult = await parseJsonBody<{ title?: string; description?: string; thumbnail_url?: string }>(request)
  if (bodyResult.error) return bodyResult.error

  const { title, description, thumbnail_url } = bodyResult.data

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title.trim()
  if (description !== undefined) updateData.description = description?.trim() || null
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url || null

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
  const authResult = await requireAuth(supabase)
  if (authResult.error) return authResult.error

  // 소유자 확인
  const ownershipResult = await requireOwnership(supabase, 'projects', projectId, authResult.user.id)
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
