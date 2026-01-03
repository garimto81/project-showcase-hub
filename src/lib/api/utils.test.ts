import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireOwnership, parseJsonBody, apiError, apiSuccess } from './utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Mock response 타입 정의
type MockResponse = {
  data: unknown
  status: number
}

// Next.js NextResponse mock
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: unknown, options?: { status?: number }): MockResponse => ({
      data,
      status: options?.status || 200,
    })),
  },
}))

// Supabase 클라이언트 mock 생성 헬퍼
function createMockSupabase(overrides?: {
  user?: { id: string } | null
  resourceData?: Record<string, unknown> | null
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: overrides?.user ?? null },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: overrides?.resourceData ?? null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>
}

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('인증된 사용자가 있으면 user를 반환한다', async () => {
      const mockUser = { id: 'user-123' }
      const supabase = createMockSupabase({ user: mockUser })

      const result = await requireAuth(supabase)

      expect(result).toEqual({ user: mockUser })
      expect('error' in result).toBe(false)
    })

    it('인증된 사용자가 없으면 401 에러를 반환한다', async () => {
      const supabase = createMockSupabase({ user: null })

      const result = await requireAuth(supabase)

      expect('error' in result).toBe(true)
      if ('error' in result && result.error) {
        const mockError = result.error as unknown as MockResponse
        expect(mockError.status).toBe(401)
        expect(mockError.data).toEqual({ error: '로그인이 필요합니다' })
      }
    })
  })

  describe('requireOwnership', () => {
    it('프로젝트 소유자가 일치하면 success를 반환한다', async () => {
      const userId = 'user-123'
      const supabase = createMockSupabase({
        resourceData: { owner_id: userId },
      })

      const result = await requireOwnership(supabase, 'projects', 'project-1', userId)

      expect(result).toEqual({ success: true })
    })

    it('댓글 소유자가 일치하면 success를 반환한다', async () => {
      const userId = 'user-123'
      const supabase = createMockSupabase({
        resourceData: { user_id: userId },
      })

      const result = await requireOwnership(supabase, 'comments', 'comment-1', userId)

      expect(result).toEqual({ success: true })
    })

    it('리소스가 없으면 404 에러를 반환한다', async () => {
      const supabase = createMockSupabase({ resourceData: null })

      const result = await requireOwnership(supabase, 'projects', 'not-exist', 'user-123')

      expect('error' in result).toBe(true)
      if ('error' in result && result.error) {
        const mockError = result.error as unknown as MockResponse
        expect(mockError.status).toBe(404)
        expect(mockError.data).toEqual({ error: '프로젝트를 찾을 수 없습니다' })
      }
    })

    it('소유자가 아니면 403 에러를 반환한다', async () => {
      const supabase = createMockSupabase({
        resourceData: { owner_id: 'other-user' },
      })

      const result = await requireOwnership(supabase, 'projects', 'project-1', 'user-123')

      expect('error' in result).toBe(true)
      if ('error' in result && result.error) {
        const mockError = result.error as unknown as MockResponse
        expect(mockError.status).toBe(403)
        expect(mockError.data).toEqual({ error: '권한이 없습니다' })
      }
    })
  })

  describe('parseJsonBody', () => {
    it('유효한 JSON을 파싱하면 data를 반환한다', async () => {
      const mockData = { name: 'test', value: 123 }
      const request = {
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Request

      const result = await parseJsonBody(request)

      expect(result).toEqual({ data: mockData })
    })

    it('잘못된 JSON이면 400 에러를 반환한다', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request

      const result = await parseJsonBody(request)

      expect('error' in result).toBe(true)
      if ('error' in result && result.error) {
        const mockError = result.error as unknown as MockResponse
        expect(mockError.status).toBe(400)
        expect(mockError.data).toEqual({ error: '잘못된 요청 형식입니다' })
      }
    })
  })

  describe('apiError', () => {
    it('badRequest는 400 상태를 반환한다', () => {
      const result = apiError.badRequest() as unknown as MockResponse
      expect(result.status).toBe(400)
      expect(result.data).toEqual({ error: '잘못된 요청입니다' })
    })

    it('badRequest는 커스텀 메시지를 지원한다', () => {
      const result = apiError.badRequest('필수 필드가 없습니다') as unknown as MockResponse
      expect(result.data).toEqual({ error: '필수 필드가 없습니다' })
    })

    it('unauthorized는 401 상태를 반환한다', () => {
      const result = apiError.unauthorized() as unknown as MockResponse
      expect(result.status).toBe(401)
      expect(result.data).toEqual({ error: '로그인이 필요합니다' })
    })

    it('forbidden는 403 상태를 반환한다', () => {
      const result = apiError.forbidden() as unknown as MockResponse
      expect(result.status).toBe(403)
      expect(result.data).toEqual({ error: '권한이 없습니다' })
    })

    it('notFound는 404 상태를 반환한다', () => {
      const result = apiError.notFound() as unknown as MockResponse
      expect(result.status).toBe(404)
      expect(result.data).toEqual({ error: '리소스를 찾을 수 없습니다' })
    })

    it('serverError는 500 상태를 반환한다', () => {
      const result = apiError.serverError() as unknown as MockResponse
      expect(result.status).toBe(500)
      expect(result.data).toEqual({ error: '서버 오류가 발생했습니다' })
    })
  })

  describe('apiSuccess', () => {
    it('ok는 200 상태로 데이터를 반환한다', () => {
      const data = { id: 1, name: 'test' }
      const result = apiSuccess.ok(data) as unknown as MockResponse
      expect(result.status).toBe(200)
      expect(result.data).toEqual(data)
    })

    it('created는 201 상태로 데이터를 반환한다', () => {
      const data = { id: 1, name: 'new item' }
      const result = apiSuccess.created(data) as unknown as MockResponse
      expect(result.status).toBe(201)
      expect(result.data).toEqual(data)
    })

    it('deleted는 성공 응답을 반환한다', () => {
      const result = apiSuccess.deleted() as unknown as MockResponse
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ success: true })
    })
  })
})
