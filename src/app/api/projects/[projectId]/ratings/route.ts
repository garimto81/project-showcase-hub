import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  requireAuth,
  parseJsonBody,
  apiError,
  apiSuccess,
} from '@/lib/api/utils'

// GET: 프로젝트 별점 목록 및 통계
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ratings')
    .select('*, profiles(display_name, avatar_url)')
    .eq('project_id', projectId)

  if (error) {
    return apiError.serverError(error.message)
  }

  // 평균 및 분포 계산
  const ratings = data || []
  const total = ratings.length
  const average = total > 0
    ? ratings.reduce((sum, r) => sum + r.score, 0) / total
    : 0

  const distribution = ratings.reduce((acc, r) => {
    acc[r.score] = (acc[r.score] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return apiSuccess.ok({
    ratings,
    average,
    total,
    distribution,
  })
}

// POST: 별점 생성/수정 (upsert)
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
  const bodyResult = await parseJsonBody<{ score?: number }>(request)
  if (bodyResult.error) return bodyResult.error

  const { score } = bodyResult.data
  if (!score || score < 1 || score > 5) {
    return apiError.badRequest('1-5 사이의 점수를 입력해주세요')
  }

  const { data, error } = await supabase
    .from('ratings')
    .upsert(
      {
        project_id: projectId,
        user_id: authResult.user.id,
        score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,user_id' }
    )
    .select()
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.ok(data)
}

// DELETE: 별점 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  // 인증 확인
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', authResult.user.id)

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.deleted()
}
