import { NextResponse } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type ApiError = {
  error: string
}

type AuthResult = {
  user: User
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
 * 인증된 사용자 확인
 * @returns 인증된 사용자 또는 401 에러 응답
 */
export async function requireAuth(
  supabase: SupabaseClient<Database>
): Promise<AuthResult> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
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
 * 리소스 소유권 확인
 * @param supabase - Supabase 클라이언트
 * @param table - 테이블명
 * @param resourceId - 리소스 ID
 * @param userId - 확인할 사용자 ID
 * @param ownerField - 소유자 필드명 (기본값: 'owner_id')
 * @returns 성공 또는 403/404 에러 응답
 */
export async function requireOwnership(
  supabase: SupabaseClient<Database>,
  table: 'projects' | 'comments',
  resourceId: string,
  userId: string,
  ownerField: string = table === 'projects' ? 'owner_id' : 'user_id'
): Promise<OwnershipResult> {
  const { data: resource } = await supabase
    .from(table)
    .select(ownerField)
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

  const ownerId = resource[ownerField as keyof typeof resource] as string
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
