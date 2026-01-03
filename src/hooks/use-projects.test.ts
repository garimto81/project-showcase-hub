import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjects } from './use-projects'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockProjectsResponse = {
    projects: [
      {
        id: '1',
        title: 'Test Project',
        description: 'A test project',
        owner_id: 'user-1',
        is_favorite: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        profile: { display_name: 'Test User', avatar_url: null },
      },
    ],
    total: 1,
    limit: 20,
    offset: 0,
  }

  describe('초기 로딩', () => {
    it('마운트 시 프로젝트 목록을 가져온다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectsResponse),
      })

      const { result } = renderHook(() => useProjects())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].title).toBe('Test Project')
      expect(result.current.total).toBe(1)
      expect(result.current.error).toBeNull()
    })

    it('fetch 실패 시 에러를 설정한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '서버 오류' }),
      })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('서버 오류')
      expect(result.current.projects).toHaveLength(0)
    })

    it('네트워크 오류 시 에러 메시지를 설정한다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('옵션 파라미터', () => {
    it('userId 옵션으로 필터링된 요청을 보낸다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectsResponse),
      })

      renderHook(() => useProjects({ userId: 'user-123' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('userId=user-123')
        )
      })
    })

    it('search 옵션으로 검색 요청을 보낸다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectsResponse),
      })

      renderHook(() => useProjects({ search: 'test' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=test')
        )
      })
    })

    it('favoritesOnly 옵션으로 즐겨찾기만 조회한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectsResponse),
      })

      renderHook(() => useProjects({ favoritesOnly: true }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('favoritesOnly=true')
        )
      })
    })

    it('limit 옵션을 적용한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectsResponse),
      })

      renderHook(() => useProjects({ limit: 10 }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=10')
        )
      })
    })
  })

  describe('create', () => {
    it('프로젝트를 생성하고 성공 결과를 반환한다', async () => {
      const newProject = {
        id: '2',
        title: 'New Project',
        description: null,
        owner_id: 'user-1',
        is_favorite: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newProject),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: { data: unknown; error: string | null } | undefined
      await act(async () => {
        createResult = await result.current.create({ title: 'New Project' })
      })

      expect(createResult?.data).toEqual(newProject)
      expect(createResult?.error).toBeNull()
    })

    it('프로젝트 생성 실패 시 에러를 반환한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '제목이 필요합니다' }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: { data: unknown; error: string | null } | undefined
      await act(async () => {
        createResult = await result.current.create({ title: '' })
      })

      expect(createResult?.data).toBeNull()
      expect(createResult?.error).toBe('제목이 필요합니다')
    })
  })

  describe('createProject', () => {
    it('프로젝트 생성 후 목록을 새로고침한다', async () => {
      const newProject = {
        id: '2',
        title: 'New Project',
        owner_id: 'user-1',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newProject),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockProjectsResponse,
            projects: [...mockProjectsResponse.projects, newProject],
            total: 2,
          }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createProject({ title: 'New Project' })
      })

      // refetch가 호출되었는지 확인 (3번째 fetch)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('생성 실패 시 에러를 throw한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '권한이 없습니다' }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.createProject({ title: 'New Project' })
        })
      ).rejects.toThrow('권한이 없습니다')
    })
  })

  describe('updateProject', () => {
    it('프로젝트를 수정하고 목록을 새로고침한다', async () => {
      const updatedProject = {
        ...mockProjectsResponse.projects[0],
        title: 'Updated Title',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedProject),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockProjectsResponse,
            projects: [updatedProject],
          }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateProject('1', { title: 'Updated Title' })
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated Title' }),
        })
      )
    })
  })

  describe('deleteProject', () => {
    it('프로젝트를 삭제하고 목록을 새로고침한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockProjectsResponse,
            projects: [],
            total: 0,
          }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteProject('1')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('toggleFavorite', () => {
    it('즐겨찾기를 낙관적으로 업데이트한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects[0].is_favorite).toBe(false)

      act(() => {
        result.current.toggleFavorite('1', true)
      })

      // 낙관적 업데이트 확인
      expect(result.current.projects[0].is_favorite).toBe(true)
    })

    it('API 실패 시 롤백한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '권한 없음' }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects[0].is_favorite).toBe(false)

      await expect(
        act(async () => {
          await result.current.toggleFavorite('1', true)
        })
      ).rejects.toThrow('권한 없음')

      // 롤백 확인
      expect(result.current.projects[0].is_favorite).toBe(false)
    })
  })

  describe('refetch', () => {
    it('refetch 호출 시 프로젝트를 다시 가져온다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockProjectsResponse,
            projects: [
              ...mockProjectsResponse.projects,
              { id: '2', title: 'New Project' },
            ],
            total: 2,
          }),
        })

      const { result } = renderHook(() => useProjects())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toHaveLength(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.projects).toHaveLength(2)
    })
  })
})
