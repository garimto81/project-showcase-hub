import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
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

// POST: 별점 생성 (익명 사용자 지원)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  // 현재 사용자 정보 가져오기 (익명 허용)
  const user = await getAuthUser()

  // JSON 파싱
  const bodyResult = await parseJsonBody<{ score?: number }>(request)
  if (bodyResult.error) return bodyResult.error

  const { score } = bodyResult.data
  if (!score || score < 1 || score > 5) {
    return apiError.badRequest('1-5 사이의 점수를 입력해주세요')
  }

  // 사용자 ID 설정 (익명이면 null로 RLS 정책 통과)
  const userId = user.role === 'anonymous' ? null : user.id

  // 기존 별점 확인 (로그인 사용자 및 익명 사용자 모두)
  let existingQuery = supabase
    .from('ratings')
    .select('id')
    .eq('project_id', projectId)

  if (userId) {
    existingQuery = existingQuery.eq('user_id', userId)
  } else {
    existingQuery = existingQuery.is('user_id', null)
  }

  const { data: existingList } = await existingQuery.limit(1)
  const existing = existingList?.[0]

  if (existing) {
    // 기존 별점 업데이트 (upsert)
    const { data, error } = await supabase
      .from('ratings')
      .update({ score })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return apiError.serverError(error.message)
    }

    return apiSuccess.ok(data)
  }

  // 새 별점 생성
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      project_id: projectId,
      user_id: userId,
      score,
    })
    .select()
    .single()

  if (error) {
    return apiError.serverError(error.message)
  }

  return apiSuccess.created(data)
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
