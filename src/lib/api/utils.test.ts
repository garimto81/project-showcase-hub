import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseJsonBody, apiError, apiSuccess } from './utils'

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

// 세션 관련 mock은 통합 테스트에서 처리
// requireAuth와 requireOwnership은 세션/DB 의존성이 있어 단위 테스트에서 제외

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
