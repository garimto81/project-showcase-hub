import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGitHubRepos } from './use-github-repos'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useGitHubRepos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockRepos = {
    repos: [
      {
        id: 1,
        name: 'project-1',
        full_name: 'user/project-1',
        description: 'First project',
        html_url: 'https://github.com/user/project-1',
        homepage: 'https://project-1.vercel.app',
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 2,
        updated_at: '2025-01-01T00:00:00Z',
        private: false,
      },
      {
        id: 2,
        name: 'project-2',
        full_name: 'user/project-2',
        description: 'Second project',
        html_url: 'https://github.com/user/project-2',
        homepage: null,
        language: 'JavaScript',
        stargazers_count: 5,
        forks_count: 1,
        updated_at: '2025-01-02T00:00:00Z',
        private: false,
      },
    ],
  }

  describe('초기 로딩', () => {
    it('마운트 시 GitHub 레포지토리 목록을 가져온다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      })

      const { result } = renderHook(() => useGitHubRepos())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.repos).toHaveLength(2)
      expect(result.current.repos[0].name).toBe('project-1')
      expect(result.current.repos[0].full_name).toBe('user/project-1')
      expect(result.current.error).toBeNull()
    })

    it('올바른 API 엔드포인트를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      })

      renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/github/repos')
      })
    })

    it('fetch 실패 시 에러를 설정한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'GitHub 연동이 필요합니다' }),
      })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('GitHub 연동이 필요합니다')
      expect(result.current.repos).toHaveLength(0)
    })

    it('네트워크 오류 시 에러 메시지를 설정한다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.repos).toHaveLength(0)
    })

    it('API 응답에 에러 메시지가 없으면 기본 메시지를 사용한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('GitHub 레포지토리를 가져오는데 실패했습니다')
    })
  })

  describe('refetch', () => {
    it('refetch 호출 시 레포지토리를 다시 가져온다', async () => {
      const newRepo = {
        id: 3,
        name: 'project-3',
        full_name: 'user/project-3',
        description: 'Third project',
        html_url: 'https://github.com/user/project-3',
        homepage: null,
        language: 'Python',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2025-01-03T00:00:00Z',
        private: false,
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRepos),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            repos: [...mockRepos.repos, newRepo],
          }),
        })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.repos).toHaveLength(2)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.repos).toHaveLength(3)
      expect(result.current.repos[2].name).toBe('project-3')
    })

    it('refetch 중 loading 상태가 true로 변경된다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRepos),
        })
        .mockImplementationOnce(() =>
          new Promise((resolve) =>
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve(mockRepos),
            }), 100)
          )
        )

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('refetch 시 이전 에러를 초기화한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '첫 번째 에러' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRepos),
        })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('첫 번째 에러')

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.repos).toHaveLength(2)
    })
  })

  describe('레포 데이터 구조', () => {
    it('레포 데이터에 필수 필드가 포함되어 있다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const repo = result.current.repos[0]
      expect(repo).toHaveProperty('id')
      expect(repo).toHaveProperty('name')
      expect(repo).toHaveProperty('full_name')
      expect(repo).toHaveProperty('description')
      expect(repo).toHaveProperty('html_url')
      expect(repo).toHaveProperty('homepage')
      expect(repo).toHaveProperty('language')
      expect(repo).toHaveProperty('stargazers_count')
      expect(repo).toHaveProperty('forks_count')
      expect(repo).toHaveProperty('updated_at')
      expect(repo).toHaveProperty('private')
    })

    it('homepage가 null일 수 있다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const repoWithHomepage = result.current.repos[0]
      const repoWithoutHomepage = result.current.repos[1]

      expect(repoWithHomepage.homepage).toBe('https://project-1.vercel.app')
      expect(repoWithoutHomepage.homepage).toBeNull()
    })
  })

  describe('빈 레포 목록', () => {
    it('레포가 없으면 빈 배열을 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ repos: [] }),
      })

      const { result } = renderHook(() => useGitHubRepos())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.repos).toHaveLength(0)
      expect(result.current.error).toBeNull()
    })
  })
})
