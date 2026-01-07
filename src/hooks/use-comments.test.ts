import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useComments } from './use-comments'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockComments = [
    {
      id: 'comment-1',
      project_id: 'project-1',
      user_id: 'user-1',
      content: '첫 번째 댓글입니다',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      profile: { display_name: 'User 1', avatar_url: null },
    },
    {
      id: 'comment-2',
      project_id: 'project-1',
      user_id: 'user-2',
      content: '두 번째 댓글입니다',
      created_at: '2025-01-01T01:00:00Z',
      updated_at: '2025-01-01T01:00:00Z',
      profile: { display_name: 'User 2', avatar_url: null },
    },
  ]

  describe('초기 로딩', () => {
    it('마운트 시 댓글 목록을 가져온다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComments),
      })

      const { result } = renderHook(() => useComments('project-1'))

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments).toHaveLength(2)
      expect(result.current.comments[0].content).toBe('첫 번째 댓글입니다')
      expect(result.current.error).toBeNull()
    })

    it('올바른 API 엔드포인트를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComments),
      })

      renderHook(() => useComments('project-123'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-123/comments')
      })
    })

    it('fetch 실패 시 에러를 설정한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '서버 오류' }),
      })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // useFetch는 서버 응답의 error 메시지를 우선 사용
      expect(result.current.error).toBe('서버 오류')
      expect(result.current.comments).toHaveLength(0)
    })

    it('네트워크 오류 시 에러 메시지를 설정한다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('addComment', () => {
    it('댓글을 추가하고 목록을 새로고침한다', async () => {
      const newComment = {
        id: 'comment-3',
        project_id: 'project-1',
        user_id: 'user-1',
        content: '새 댓글',
        created_at: '2025-01-01T02:00:00Z',
        updated_at: '2025-01-01T02:00:00Z',
        profile: { display_name: 'User 1', avatar_url: null },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newComment),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockComments, newComment]),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.addComment('새 댓글', '홍길동')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/project-1/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: '새 댓글', author_name: '홍길동' }),
        })
      )
    })

    it('댓글 추가 실패 시 에러를 throw한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '로그인이 필요합니다' }),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.addComment('새 댓글', '홍길동')
        })
      ).rejects.toThrow('로그인이 필요합니다')
    })
  })

  describe('updateComment', () => {
    it('댓글을 수정하고 목록을 새로고침한다', async () => {
      const updatedComment = { ...mockComments[0], content: '수정된 댓글' }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedComment),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([updatedComment, mockComments[1]]),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateComment('comment-1', '수정된 댓글')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/comments/comment-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ content: '수정된 댓글' }),
        })
      )
    })

    it('댓글 수정 실패 시 에러를 throw한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '권한이 없습니다' }),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.updateComment('comment-1', '수정된 댓글')
        })
      ).rejects.toThrow('권한이 없습니다')
    })
  })

  describe('deleteComment', () => {
    it('댓글을 삭제하고 목록을 새로고침한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockComments[1]]),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteComment('comment-1')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/comments/comment-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('댓글 삭제 실패 시 에러를 throw한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: '삭제 권한이 없습니다' }),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.deleteComment('comment-1')
        })
      ).rejects.toThrow('삭제 권한이 없습니다')
    })
  })

  describe('refetch', () => {
    it('refetch 호출 시 댓글을 다시 가져온다', async () => {
      const newComment = {
        id: 'comment-3',
        project_id: 'project-1',
        user_id: 'user-3',
        content: '세 번째 댓글',
        created_at: '2025-01-01T03:00:00Z',
        updated_at: '2025-01-01T03:00:00Z',
        profile: { display_name: 'User 3', avatar_url: null },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockComments, newComment]),
        })

      const { result } = renderHook(() => useComments('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments).toHaveLength(2)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.comments).toHaveLength(3)
    })
  })

  describe('projectId 변경', () => {
    it('projectId가 변경되면 새 댓글을 가져온다', async () => {
      const project2Comments = [
        {
          id: 'comment-p2-1',
          project_id: 'project-2',
          user_id: 'user-1',
          content: '프로젝트 2의 댓글',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          profile: { display_name: 'User 1', avatar_url: null },
        },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComments),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(project2Comments),
        })

      const { result, rerender } = renderHook(
        ({ projectId }) => useComments(projectId),
        { initialProps: { projectId: 'project-1' } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments).toHaveLength(2)

      rerender({ projectId: 'project-2' })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-2/comments')
      })

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(1)
        expect(result.current.comments[0].content).toBe('프로젝트 2의 댓글')
      })
    })
  })
})
