import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommentsSection } from './comments-section'
import type { CommentWithProfile } from '@/types/database'

// useAuth mock
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// useComments mock
const mockUseComments = vi.fn()
vi.mock('@/hooks/use-comments', () => ({
  useComments: () => mockUseComments(),
}))

// CommentForm mock
vi.mock('./comment-form', () => ({
  CommentForm: ({ placeholder }: { placeholder: string }) => (
    <div data-testid="comment-form">
      <input placeholder={placeholder} />
    </div>
  ),
}))

// CommentItem mock
vi.mock('./comment-item', () => ({
  CommentItem: ({ comment }: { comment: CommentWithProfile }) => (
    <div data-testid={`comment-item-${comment.id}`}>
      <p>{comment.content}</p>
    </div>
  ),
}))

describe('CommentsSection', () => {
  const mockComments: CommentWithProfile[] = [
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
      profile: { display_name: 'User 2', avatar_url: 'https://example.com/avatar.jpg' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('로딩 상태', () => {
    it('로딩 중 스켈레톤을 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: true,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      const { container } = render(<CommentsSection projectId="project-1" />)

      // 로딩 스켈레톤 확인
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('로딩 중에는 댓글 목록을 표시하지 않는다', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false })
      mockUseComments.mockReturnValue({
        comments: mockComments,
        loading: true,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.queryByTestId('comment-item-comment-1')).not.toBeInTheDocument()
    })
  })

  describe('로그인 상태에 따른 폼 표시', () => {
    it('로그인한 사용자에게 댓글 작성 폼을 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByTestId('comment-form')).toBeInTheDocument()
    })

    it('로그인하지 않은 사용자에게 로그인 안내 메시지를 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByText(/댓글을 작성하려면 로그인이 필요합니다/i)).toBeInTheDocument()
      expect(screen.queryByTestId('comment-form')).not.toBeInTheDocument()
    })

    it('인증 로딩 중에는 폼 영역을 표시하지 않는다', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.queryByTestId('comment-form')).not.toBeInTheDocument()
      expect(screen.queryByText(/로그인이 필요합니다/i)).not.toBeInTheDocument()
    })
  })

  describe('댓글 목록', () => {
    it('댓글 목록을 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: mockComments,
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByTestId('comment-item-comment-1')).toBeInTheDocument()
      expect(screen.getByTestId('comment-item-comment-2')).toBeInTheDocument()
    })

    it('각 댓글의 내용을 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: mockComments,
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByText('첫 번째 댓글입니다')).toBeInTheDocument()
      expect(screen.getByText('두 번째 댓글입니다')).toBeInTheDocument()
    })

    it('댓글 개수를 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: mockComments,
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByText('댓글 2개')).toBeInTheDocument()
    })
  })

  describe('빈 댓글 상태', () => {
    it('댓글이 없을 때 안내 메시지를 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByText(/아직 댓글이 없습니다/i)).toBeInTheDocument()
      expect(screen.getByText(/첫 댓글을 남겨보세요/i)).toBeInTheDocument()
    })

    it('댓글이 없어도 로그인한 사용자에게 폼을 표시한다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByTestId('comment-form')).toBeInTheDocument()
    })
  })

  describe('댓글 폼 placeholder', () => {
    it('댓글 작성 폼에 placeholder가 표시된다', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
      mockUseComments.mockReturnValue({
        comments: [],
        loading: false,
        addComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      })

      render(<CommentsSection projectId="project-1" />)

      expect(screen.getByPlaceholderText('댓글을 남겨주세요...')).toBeInTheDocument()
    })
  })
})
