import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectForm } from './project-form'

// toast mock
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// useRouter mock
const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

describe('ProjectForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('생성 모드', () => {
    it('생성 모드 폼을 렌더링한다', () => {
      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      expect(screen.getByText('새 프로젝트')).toBeInTheDocument()
      expect(screen.getByText('새로운 프로젝트를 만들어보세요')).toBeInTheDocument()
      expect(screen.getByLabelText(/프로젝트 제목/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/설명/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/썸네일 URL/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /프로젝트 생성/i })).toBeInTheDocument()
    })

    it('제목 없이는 제출되지 않는다', async () => {
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('제목만으로 프로젝트를 생성할 수 있다', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/프로젝트 제목/i), '새 프로젝트')
      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: '새 프로젝트',
          description: undefined,
          thumbnail_url: undefined,
        })
      })
    })

    it('모든 필드를 입력하여 생성할 수 있다', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/프로젝트 제목/i), '멋진 프로젝트')
      await user.type(screen.getByLabelText(/설명/i), '이것은 멋진 프로젝트입니다')
      await user.type(screen.getByLabelText(/썸네일 URL/i), 'https://example.com/image.jpg')
      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: '멋진 프로젝트',
          description: '이것은 멋진 프로젝트입니다',
          thumbnail_url: 'https://example.com/image.jpg',
        })
      })
    })

    it('성공 시 프로젝트 목록으로 이동한다', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/프로젝트 제목/i), '새 프로젝트')
      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/projects')
      })
    })
  })

  describe('수정 모드', () => {
    const initialData = {
      id: 'project-1',
      title: '기존 프로젝트',
      description: '기존 설명',
      thumbnail_url: 'https://example.com/old.jpg',
    }

    it('수정 모드 폼을 렌더링한다', () => {
      render(
        <ProjectForm mode="edit" initialData={initialData} onSubmit={mockOnSubmit} />
      )

      expect(screen.getByText('프로젝트 수정')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 정보를 수정하세요')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /변경사항 저장/i })).toBeInTheDocument()
    })

    it('초기 데이터로 폼을 채운다', () => {
      render(
        <ProjectForm mode="edit" initialData={initialData} onSubmit={mockOnSubmit} />
      )

      expect(screen.getByLabelText(/프로젝트 제목/i)).toHaveValue('기존 프로젝트')
      expect(screen.getByLabelText(/설명/i)).toHaveValue('기존 설명')
      expect(screen.getByLabelText(/썸네일 URL/i)).toHaveValue('https://example.com/old.jpg')
    })

    it('수정된 데이터로 제출한다', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()

      render(
        <ProjectForm mode="edit" initialData={initialData} onSubmit={mockOnSubmit} />
      )

      await user.clear(screen.getByLabelText(/프로젝트 제목/i))
      await user.type(screen.getByLabelText(/프로젝트 제목/i), '수정된 프로젝트')
      await user.click(screen.getByRole('button', { name: /변경사항 저장/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: '수정된 프로젝트',
          description: '기존 설명',
          thumbnail_url: 'https://example.com/old.jpg',
        })
      })
    })
  })

  describe('제출 상태', () => {
    it('제출 중 폼이 비활성화된다', async () => {
      let resolveSubmit: () => void
      mockOnSubmit.mockImplementationOnce(
        () => new Promise((resolve) => { resolveSubmit = resolve })
      )
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/프로젝트 제목/i), '새 프로젝트')
      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      expect(screen.getByRole('button', { name: /생성 중/i })).toBeDisabled()
      expect(screen.getByLabelText(/프로젝트 제목/i)).toBeDisabled()
      expect(screen.getByLabelText(/설명/i)).toBeDisabled()
      expect(screen.getByLabelText(/썸네일 URL/i)).toBeDisabled()

      resolveSubmit!()

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('제출 실패 시 에러 토스트를 표시한다', async () => {
      const { toast } = await import('sonner')
      mockOnSubmit.mockRejectedValueOnce(new Error('권한이 없습니다'))
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/프로젝트 제목/i), '새 프로젝트')
      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('권한이 없습니다')
      })
    })
  })

  describe('취소 버튼', () => {
    it('취소 버튼을 렌더링한다', () => {
      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument()
    })

    it('취소 버튼 클릭 시 뒤로 이동한다', async () => {
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.click(screen.getByRole('button', { name: /취소/i }))

      expect(mockBack).toHaveBeenCalled()
    })

    it('제출 중에는 취소 버튼이 비활성화된다', async () => {
      let resolveSubmit: () => void
      mockOnSubmit.mockImplementationOnce(
        () => new Promise((resolve) => { resolveSubmit = resolve })
      )
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/프로젝트 제목/i), '새 프로젝트')
      await user.click(screen.getByRole('button', { name: /프로젝트 생성/i }))

      expect(screen.getByRole('button', { name: /취소/i })).toBeDisabled()

      resolveSubmit!()

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('썸네일 미리보기', () => {
    it('썸네일 URL 입력 시 미리보기를 표시한다', async () => {
      const user = userEvent.setup()

      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/썸네일 URL/i), 'https://example.com/image.jpg')

      expect(screen.getByAltText('썸네일 미리보기')).toBeInTheDocument()
    })

    it('썸네일 URL이 비어있으면 미리보기를 표시하지 않는다', () => {
      render(<ProjectForm mode="create" onSubmit={mockOnSubmit} />)

      expect(screen.queryByAltText('썸네일 미리보기')).not.toBeInTheDocument()
    })
  })
})
