import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRepoScanner } from './use-repo-scanner'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useRepoScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockScanResult = {
    success: true,
    result: {
      totalRepos: 10,
      scannedRepos: 10,
      detectedApps: 3,
      savedApps: 2,
      existingApps: 1,
      skippedRepos: 0,
      errors: 0,
    },
    apps: [
      {
        id: 'app-1',
        title: 'Project 1',
        url: 'https://project-1.vercel.app',
        github_repo: 'user/project-1',
        app_type: 'web_app',
      },
      {
        id: 'app-2',
        title: 'Project 2',
        url: 'https://project-2.netlify.app',
        github_repo: 'user/project-2',
        app_type: 'web_app',
      },
    ],
  }

  describe('초기 상태', () => {
    it('초기 상태가 idle이다', () => {
      const { result } = renderHook(() => useRepoScanner())

      expect(result.current.status).toBe('idle')
      expect(result.current.isScanning).toBe(false)
      expect(result.current.isCompleted).toBe(false)
      expect(result.current.hasError).toBe(false)
      expect(result.current.totalRepos).toBe(0)
      expect(result.current.scannedRepos).toBe(0)
      expect(result.current.savedApps).toBe(0)
      expect(result.current.existingApps).toBe(0)
      expect(result.current.detectedApps).toHaveLength(0)
      expect(result.current.error).toBeNull()
    })
  })

  describe('startScan', () => {
    it('스캔을 시작하고 scanning 상태로 변경된다', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockScanResult),
          }), 100)
        )
      )

      const { result } = renderHook(() => useRepoScanner())

      act(() => {
        result.current.startScan()
      })

      expect(result.current.status).toBe('scanning')
      expect(result.current.isScanning).toBe(true)

      await waitFor(() => {
        expect(result.current.status).toBe('completed')
      })
    })

    it('올바른 API 엔드포인트를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/github/scan-all',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('스캔 성공 시 결과를 저장한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.isCompleted).toBe(true)
      expect(result.current.totalRepos).toBe(10)
      expect(result.current.scannedRepos).toBe(10)
      expect(result.current.savedApps).toBe(2)
      expect(result.current.existingApps).toBe(1)
      expect(result.current.detectedApps).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('스캔 성공 시 success: true를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      })

      const { result } = renderHook(() => useRepoScanner())

      let scanResult: { success: boolean } | undefined
      await act(async () => {
        scanResult = await result.current.startScan()
      })

      expect(scanResult?.success).toBe(true)
    })

    it('API 실패 시 에러 상태로 변경된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'GitHub 연동이 필요합니다' }),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.status).toBe('error')
      expect(result.current.hasError).toBe(true)
      expect(result.current.error).toBe('GitHub 연동이 필요합니다')
    })

    it('needsGithubLink 플래그를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'GitHub 연동이 필요합니다',
          needsGithubLink: true,
        }),
      })

      const { result } = renderHook(() => useRepoScanner())

      let scanResult: { success: boolean; needsGithubLink?: boolean } | undefined
      await act(async () => {
        scanResult = await result.current.startScan()
      })

      expect(scanResult?.success).toBe(false)
      expect(scanResult?.needsGithubLink).toBe(true)
    })

    it('needsReauth 플래그를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: '재인증이 필요합니다',
          needsReauth: true,
        }),
      })

      const { result } = renderHook(() => useRepoScanner())

      let scanResult: { success: boolean; needsReauth?: boolean } | undefined
      await act(async () => {
        scanResult = await result.current.startScan()
      })

      expect(scanResult?.success).toBe(false)
      expect(scanResult?.needsReauth).toBe(true)
    })

    it('네트워크 오류 시 에러 상태로 변경된다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.status).toBe('error')
      expect(result.current.hasError).toBe(true)
      expect(result.current.error).toBe('Network error')
    })

    it('네트워크 오류가 Error 인스턴스가 아니면 기본 메시지를 사용한다', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error')

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.error).toBe('네트워크 오류가 발생했습니다')
    })

    it('에러 응답에 메시지가 없으면 기본 메시지를 사용한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.error).toBe('스캔 중 오류가 발생했습니다')
    })
  })

  describe('reset', () => {
    it('상태를 초기화한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.totalRepos).toBe(10)

      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.isScanning).toBe(false)
      expect(result.current.isCompleted).toBe(false)
      expect(result.current.hasError).toBe(false)
      expect(result.current.totalRepos).toBe(0)
      expect(result.current.scannedRepos).toBe(0)
      expect(result.current.savedApps).toBe(0)
      expect(result.current.existingApps).toBe(0)
      expect(result.current.detectedApps).toHaveLength(0)
      expect(result.current.error).toBeNull()
    })

    it('에러 상태에서도 초기화할 수 있다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '스캔 실패' }),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe('스캔 실패')

      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.error).toBeNull()
    })
  })

  describe('연속 스캔', () => {
    it('스캔 완료 후 다시 스캔할 수 있다', async () => {
      const secondScanResult = {
        ...mockScanResult,
        result: {
          ...mockScanResult.result,
          savedApps: 5,
        },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockScanResult),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondScanResult),
        })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.savedApps).toBe(2)

      act(() => {
        result.current.reset()
      })

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.savedApps).toBe(5)
    })
  })

  describe('결과 데이터가 없는 경우', () => {
    it('result가 없으면 기본값을 사용한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.totalRepos).toBe(0)
      expect(result.current.scannedRepos).toBe(0)
      expect(result.current.savedApps).toBe(0)
      expect(result.current.existingApps).toBe(0)
      expect(result.current.detectedApps).toHaveLength(0)
    })

    it('apps가 없으면 빈 배열을 사용한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          result: mockScanResult.result,
        }),
      })

      const { result } = renderHook(() => useRepoScanner())

      await act(async () => {
        await result.current.startScan()
      })

      expect(result.current.detectedApps).toHaveLength(0)
    })
  })
})
