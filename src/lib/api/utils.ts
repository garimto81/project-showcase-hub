import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

type ApiError = {
  error: string
}

// 고정 UUID
const ADMIN_UUID = '00000000-0000-0000-0000-000000000001'
const ANONYMOUS_UUID = '00000000-0000-0000-0000-000000000002'

// Admin 사용자 정보 (고정)
const ADMIN_USER = {
  id: ADMIN_UUID,
  email: 'admin@local',
  role: 'admin' as const,
}

// Anonymous 사용자 정보 (고정)
const ANONYMOUS_USER = {
  id: ANONYMOUS_UUID,
  email: 'anonymous@local',
  role: 'anonymous' as const,
}

export type UserRole = 'admin' | 'user' | 'anonymous'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
}

type AuthResult = {
  user: AuthUser
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
 * 현재 사용자 정보 가져오기 (선택적 인증)
 * 인증되지 않은 경우 Anonymous 사용자 반환
 * @returns Admin, User, 또는 Anonymous
 */
export async function getAuthUser(): Promise<AuthUser> {
  // 1. 세션 토큰 확인 (Admin)
  const session = await getSession()
  if (session.isAuthenticated) {
    return ADMIN_USER
  }

  // 2. Supabase Auth 확인 (User)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return {
      id: user.id,
      email: user.email || '',
      role: 'user' as const,
    }
  }

  // 3. 인증 없음 → Anonymous
  return ANONYMOUS_USER
}

/**
 * 인증된 사용자 확인 (Admin 또는 User만)
 * Anonymous는 거부
 * @returns 인증된 사용자 또는 401 에러 응답
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthUser()

  if (user.role === 'anonymous') {
    return {
      error: NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      ),
    }
  }

  return { user }
}

/**
 * Admin 전용 인증 확인
 * User와 Anonymous는 거부
 * @returns Admin 사용자 또는 403 에러 응답
 */
export async function requireAdmin(): Promise<AuthResult> {
  const user = await getAuthUser()

  if (user.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * 리소스 소유권 확인
 * @param table - 테이블명
 * @param resourceId - 리소스 ID
 * @param userId - 사용자 ID (현재 사용자)
 * @returns 성공 또는 403/404 에러 응답
 */
export async function requireOwnership(
  table: 'projects' | 'comments' | 'ratings',
  resourceId: string,
  userId: string
): Promise<OwnershipResult> {
  // 리소스 존재 및 소유권 확인
  const supabase = await createClient()

  let query = supabase
    .from(table)
    .select('id, user_id')
    .eq('id', resourceId)
    .single()

  // projects 테이블은 owner_id 사용
  if (table === 'projects') {
    query = supabase
      .from(table)
      .select('id, owner_id')
      .eq('id', resourceId)
      .single()
  }

  const { data: resource } = await query

  if (!resource) {
    const resourceName = table === 'projects' ? '프로젝트' : table === 'comments' ? '댓글' : '별점'
    return {
      error: NextResponse.json(
        { error: `${resourceName}를 찾을 수 없습니다` },
        { status: 404 }
      ),
    }
  }

  // 소유권 확인
  const ownerId = table === 'projects'
    ? (resource as { owner_id?: string }).owner_id
    : (resource as { user_id?: string }).user_id

  if (ownerId !== userId) {
    return {
      error: NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      ),
    }
  }

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
