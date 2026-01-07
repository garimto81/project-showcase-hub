'use client'

import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFetch } from './use-fetch'

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('초기 상태', () => {
    it('초기 데이터와 로딩 상태를 반환한다', () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })

      const { result } = renderHook(() =>
        useFetch<{ items: string[] }>({
          url: '/api/test',
          initialData: { items: [] },
        })
      )

      expect(result.current.data).toEqual({ items: [] })
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('fetchOnMount가 false면 자동 fetch하지 않는다', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      renderHook(() =>
        useFetch({
          url: '/api/test',
          initialData: null,
          fetchOnMount: false,
        })
      )

      await new Promise((r) => setTimeout(r, 50))
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('데이터 페칭', () => {
    it('마운트 시 데이터를 fetch한다', async () => {
      const mockData = { items: ['a', 'b', 'c'] }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const { result } = renderHook(() =>
        useFetch<{ items: string[] }>({
          url: '/api/test',
          initialData: { items: [] },
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })

    it('refetch 함수로 데이터를 다시 가져온다', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ count: callCount }),
        })
      })

      const { result } = renderHook(() =>
        useFetch<{ count: number }>({
          url: '/api/test',
          initialData: { count: 0 },
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data.count).toBe(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.data.count).toBe(2)
    })
  })

  describe('에러 처리', () => {
    it('fetch 실패 시 에러 상태를 설정한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '서버 오류' }),
      })

      const { result } = renderHook(() =>
        useFetch({
          url: '/api/test',
          initialData: null,
          defaultErrorMessage: '데이터를 불러오는데 실패했습니다',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('서버 오류')
      expect(result.current.data).toBe(null)
    })

    it('네트워크 오류 시 기본 에러 메시지를 표시한다', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useFetch({
          url: '/api/test',
          initialData: null,
          defaultErrorMessage: '기본 에러 메시지',
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('URL 함수', () => {
    it('URL을 함수로 전달할 수 있다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })

      const { result } = renderHook(() =>
        useFetch({
          url: () => '/api/items/1',
          initialData: null,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/items/1')
    })
  })

  describe('setData', () => {
    it('setData로 데이터를 직접 수정할 수 있다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ value: 1 }),
      })

      const { result } = renderHook(() =>
        useFetch<{ value: number }>({
          url: '/api/test',
          initialData: { value: 0 },
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setData({ value: 100 })
      })

      expect(result.current.data.value).toBe(100)
    })
  })

  describe('transform', () => {
    it('응답 데이터를 변환할 수 있다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [1, 2, 3] }),
      })

      const { result } = renderHook(() =>
        useFetch<number[], { items: number[] }>({
          url: '/api/test',
          initialData: [],
          transform: (response) => response.items,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual([1, 2, 3])
    })
  })
})
