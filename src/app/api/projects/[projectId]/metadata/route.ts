import { createClient } from '@/lib/supabase/server'
import {
  requireAdmin,
  requireOwnership,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'
import type { ProjectStatus } from '@/types/database'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

// GET: 프로젝트 메타데이터 조회
export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('project_metadata')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 메타데이터가 없으면 빈 객체 반환
      return apiSuccess.ok(null)
    }
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data)
}

// PATCH: 프로젝트 메타데이터 업데이트
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
    tech_stack?: string[]
    screenshots?: string[]
    status?: ProjectStatus
  }>(request)
  if (bodyResult.error) return bodyResult.error

  const { tech_stack, screenshots, status } = bodyResult.data

  const updateData: Record<string, unknown> = {}
  if (tech_stack !== undefined) updateData.tech_stack = tech_stack
  if (screenshots !== undefined) updateData.screenshots = screenshots
  if (status !== undefined) updateData.status = status

  // upsert로 없으면 생성, 있으면 업데이트
  const { data, error } = await supabase
    .from('project_metadata')
    .upsert(
      {
        project_id: projectId,
        ...updateData,
      },
      {
        onConflict: 'project_id',
      }
    )
    .select()
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data)
}
