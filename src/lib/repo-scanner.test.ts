import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RepoScanner, type ScanOptions } from './repo-scanner'
import type { GitHubRepo } from './deployment-detector'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

// DeploymentDetector mock
const mockDetectDeploymentUrl = vi.fn()
vi.mock('./deployment-detector', async () => {
  const actual = await vi.importActual('./deployment-detector')
  return {
    ...actual,
    DeploymentDetector: class MockDeploymentDetector {
      detectDeploymentUrl = mockDetectDeploymentUrl
    },
  }
})

describe('RepoScanner', () => {
  let scanner: RepoScanner

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockDetectDeploymentUrl.mockReset()
    scanner = new RepoScanner('test-access-token')
  })

  const mockRepos: GitHubRepo[] = [
    {
      name: 'project-1',
      full_name: 'user/project-1',
      description: 'First project',
      homepage: 'https://project-1.vercel.app',
      html_url: 'https://github.com/user/project-1',
      owner: { login: 'user' },
      has_pages: false,
      default_branch: 'main',
    },
    {
      name: 'project-2',
      full_name: 'user/project-2',
      description: 'Second project',
      homepage: null,
      html_url: 'https://github.com/user/project-2',
      owner: { login: 'user' },
      has_pages: true,
      default_branch: 'main',
    },
    {
      name: 'project-3',
      full_name: 'user/project-3',
      description: null,
      homepage: null,
      html_url: 'https://github.com/user/project-3',
      owner: { login: 'user' },
      has_pages: false,
      default_branch: 'main',
    },
  ]

  describe('scanAllRepos', () => {
    it('모든 레포를 스캔하고 결과를 반환한다', async () => {
      // fetchAllRepos mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      })

      // 각 레포의 배포 URL 탐지 결과
      mockDetectDeploymentUrl
        .mockResolvedValueOnce({
          url: 'https://project-1.vercel.app',
          source: 'github_homepage',
          confidence: 'high',
        })
        .mockResolvedValueOnce({
          url: 'https://user.github.io/project-2',
          source: 'github_pages',
          confidence: 'high',
        })
        .mockResolvedValueOnce({
          url: null,
          source: null,
          confidence: 'low',
        })

      const result = await scanner.scanAllRepos()

      expect(result.totalRepos).toBe(3)
      expect(result.scannedRepos).toBe(3)
      expect(result.detectedApps).toHaveLength(2)
      expect(result.skippedRepos).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })

    it('onProgress 콜백을 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRepos[0]]),
      })

      mockDetectDeploymentUrl.mockResolvedValueOnce({
        url: 'https://project-1.vercel.app',
        source: 'github_homepage',
        confidence: 'high',
      })

      const onProgress = vi.fn()
      const options: ScanOptions = { onProgress }

      await scanner.scanAllRepos(options)

      // 시작 시 호출
      expect(onProgress).toHaveBeenCalledWith(0, 1, 'user/project-1')
      // 완료 시 호출
      expect(onProgress).toHaveBeenCalledWith(1, 1, null)
    })

    it('onAppDetected 콜백을 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRepos[0]]),
      })

      mockDetectDeploymentUrl.mockResolvedValueOnce({
        url: 'https://project-1.vercel.app',
        source: 'github_homepage',
        confidence: 'high',
      })

      const onAppDetected = vi.fn()
      const options: ScanOptions = { onAppDetected }

      await scanner.scanAllRepos(options)

      expect(onAppDetected).toHaveBeenCalledWith(
        expect.objectContaining({
          repoFullName: 'user/project-1',
          url: 'https://project-1.vercel.app',
        })
      )
    })

    it('에러가 발생한 레포를 errors에 기록한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRepos[0]]),
      })

      mockDetectDeploymentUrl.mockRejectedValueOnce(new Error('API 오류'))

      const result = await scanner.scanAllRepos()

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        repo: 'user/project-1',
        error: 'API 오류',
      })
    })

    it('레포가 없으면 빈 결과를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const result = await scanner.scanAllRepos()

      expect(result.totalRepos).toBe(0)
      expect(result.scannedRepos).toBe(0)
      expect(result.detectedApps).toHaveLength(0)
      expect(result.skippedRepos).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('fetchAllRepos (페이지네이션)', () => {
    it('여러 페이지의 레포를 가져온다', async () => {
      // 첫 페이지 (100개 - 더 있음)
      const page1Repos = Array.from({ length: 100 }, (_, i) => ({
        ...mockRepos[0],
        name: `project-${i}`,
        full_name: `user/project-${i}`,
      }))

      // 두 번째 페이지 (50개 - 마지막)
      const page2Repos = Array.from({ length: 50 }, (_, i) => ({
        ...mockRepos[0],
        name: `project-${100 + i}`,
        full_name: `user/project-${100 + i}`,
      }))

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(page1Repos),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(page2Repos),
        })

      // 모든 레포에 대해 null 반환
      mockDetectDeploymentUrl.mockResolvedValue({
        url: null,
        source: null,
        confidence: 'low',
      })

      const result = await scanner.scanAllRepos()

      expect(result.totalRepos).toBe(150)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('API 오류 시 에러를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await expect(scanner.scanAllRepos()).rejects.toThrow('GitHub API 오류: 401')
    })
  })

  describe('scanSingleRepo', () => {
    it('단일 레포를 스캔한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos[0]),
      })

      mockDetectDeploymentUrl.mockResolvedValueOnce({
        url: 'https://project-1.vercel.app',
        source: 'github_homepage',
        confidence: 'high',
      })

      const result = await scanner.scanSingleRepo('user', 'project-1')

      expect(result).toEqual(
        expect.objectContaining({
          repoFullName: 'user/project-1',
          url: 'https://project-1.vercel.app',
        })
      )
    })

    it('레포를 찾을 수 없으면 에러를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(scanner.scanSingleRepo('user', 'nonexistent')).rejects.toThrow(
        '레포를 찾을 수 없습니다: user/nonexistent'
      )
    })

    it('배포 URL이 없으면 null을 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos[2]),
      })

      mockDetectDeploymentUrl.mockResolvedValueOnce({
        url: null,
        source: null,
        confidence: 'low',
      })

      const result = await scanner.scanSingleRepo('user', 'project-3')

      expect(result).toBeNull()
    })
  })

  describe('병렬 처리', () => {
    it('동시에 5개씩 스캔한다', async () => {
      // 10개의 레포 생성
      const tenRepos = Array.from({ length: 10 }, (_, i) => ({
        ...mockRepos[0],
        name: `project-${i}`,
        full_name: `user/project-${i}`,
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tenRepos),
      })

      // 각 레포에 대해 지연된 응답
      let callCount = 0
      mockDetectDeploymentUrl.mockImplementation(() => {
        callCount++
        return Promise.resolve({
          url: null,
          source: null,
          confidence: 'low',
        })
      })

      const result = await scanner.scanAllRepos()

      expect(result.totalRepos).toBe(10)
      expect(result.scannedRepos).toBe(10)
      // 모든 레포가 스캔되었는지 확인
      expect(mockDetectDeploymentUrl).toHaveBeenCalledTimes(10)
    })
  })
})
