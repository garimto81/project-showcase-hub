import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

type ApiError = {
  error: string
}

// Admin 사용자 정보 (고정)
const ADMIN_USER = {
  id: 'admin',
  email: 'admin@local',
}

type AdminUser = typeof ADMIN_USER

type AuthResult = {
  user: AdminUser
  error?: never
} | {
  user?: never
  error: NextResponse<ApiError>
}

type OwnershipResult = {
  success: true
  error?: never
} | {
  success?: never
  error: NextResponse<ApiError>
}

/**
 * 인증된 사용자 확인 (세션 기반)
 * @returns 인증된 사용자 또는 401 에러 응답
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession()

  if (!session.isAuthenticated) {
    return {
      error: NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      ),
    }
  }

  return { user: ADMIN_USER }
}

/**
 * 리소스 소유권 확인
 * 단일 사용자 시스템이므로 인증만 확인하고 소유권은 항상 성공
 * @param table - 테이블명
 * @param resourceId - 리소스 ID
 * @returns 성공 또는 403/404 에러 응답
 */
export async function requireOwnership(
  table: 'projects' | 'comments',
  resourceId: string
): Promise<OwnershipResult> {
  // 먼저 인증 확인
  const authResult = await requireAuth()
  if (authResult.error) {
    return { error: authResult.error }
  }

  // 리소스 존재 확인
  const supabase = await createClient()
  const { data: resource } = await supabase
    .from(table)
    .select('id')
    .eq('id', resourceId)
    .single()

  if (!resource) {
    const resourceName = table === 'projects' ? '프로젝트' : '댓글'
    return {
      error: NextResponse.json(
        { error: `${resourceName}를 찾을 수 없습니다` },
        { status: 404 }
      ),
    }
  }

  // 단일 사용자이므로 인증되면 소유권 있음
  return { success: true }
}

/**
 * 안전한 JSON 파싱
 * @returns 파싱된 body 또는 400 에러 응답
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse<ApiError> }> {
  try {
    const data = await request.json() as T
    return { data }
  } catch {
    return {
      error: NextResponse.json(
        { error: '잘못된 요청 형식입니다' },
        { status: 400 }
      ),
    }
  }
}

/**
 * 표준화된 에러 응답 생성
 */
export const apiError = {
  badRequest: (message: string = '잘못된 요청입니다') =>
    NextResponse.json({ error: message }, { status: 400 }),

  unauthorized: (message: string = '로그인이 필요합니다') =>
    NextResponse.json({ error: message }, { status: 401 }),

  forbidden: (message: string = '권한이 없습니다') =>
    NextResponse.json({ error: message }, { status: 403 }),

  notFound: (message: string = '리소스를 찾을 수 없습니다') =>
    NextResponse.json({ error: message }, { status: 404 }),

  serverError: (message: string = '서버 오류가 발생했습니다') =>
    NextResponse.json({ error: message }, { status: 500 }),
}

/**
 * 표준화된 성공 응답 생성
 */
export const apiSuccess = {
  ok: <T>(data: T) => NextResponse.json(data),
  created: <T>(data: T) => NextResponse.json(data, { status: 201 }),
  deleted: () => NextResponse.json({ success: true }),
}
