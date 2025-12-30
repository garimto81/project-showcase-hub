import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from './comment-form'

describe('CommentForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  describe('렌더링', () => {
    it('텍스트 영역을 렌더링한다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('기본 placeholder를 표시한다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      expect(screen.getByPlaceholderText('댓글을 입력하세요...')).toBeInTheDocument()
    })

    it('커스텀 placeholder를 표시한다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} placeholder="의견을 남겨주세요" />)

      expect(screen.getByPlaceholderText('의견을 남겨주세요')).toBeInTheDocument()
    })

    it('기본 제출 버튼 레이블은 "작성"이다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: '작성' })).toBeInTheDocument()
    })

    it('커스텀 제출 버튼 레이블을 표시한다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} submitLabel="수정" />)

      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    })

    it('onCancel이 있으면 취소 버튼을 표시한다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
    })

    it('onCancel이 없으면 취소 버튼을 표시하지 않는다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument()
    })

    it('initialValue로 텍스트 영역을 초기화한다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} initialValue="초기 텍스트" />)

      expect(screen.getByRole('textbox')).toHaveValue('초기 텍스트')
    })
  })

  describe('유효성 검사', () => {
    it('빈 입력으로는 제출 버튼이 비활성화된다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: '작성' })).toBeDisabled()
    })

    it('공백만 입력하면 제출 버튼이 비활성화된다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })

      expect(screen.getByRole('button', { name: '작성' })).toBeDisabled()
    })

    it('텍스트를 입력하면 제출 버튼이 활성화된다', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '댓글 내용' } })

      expect(screen.getByRole('button', { name: '작성' })).not.toBeDisabled()
    })
  })

  describe('제출', () => {
    it('폼 제출 시 onSubmit이 호출된다', async () => {
      const user = userEvent.setup()
      render(<CommentForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByRole('textbox'), '새 댓글')
      await user.click(screen.getByRole('button', { name: '작성' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('새 댓글')
      })
    })

    it('제출 시 앞뒤 공백이 제거된다', async () => {
      const user = userEvent.setup()
      render(<CommentForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByRole('textbox'), '  댓글 내용  ')
      await user.click(screen.getByRole('button', { name: '작성' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('댓글 내용')
      })
    })

    it('제출 성공 후 텍스트 영역이 비워진다', async () => {
      const user = userEvent.setup()
      render(<CommentForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByRole('textbox'), '댓글 내용')
      await user.click(screen.getByRole('button', { name: '작성' }))

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })

    it('제출 중 버튼 텍스트가 "등록 중..."으로 변경된다', async () => {
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()
      render(<CommentForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByRole('textbox'), '댓글')
      await user.click(screen.getByRole('button', { name: '작성' }))

      expect(screen.getByRole('button', { name: '등록 중...' })).toBeInTheDocument()
    })

    it('제출 중 텍스트 영역이 비활성화된다', async () => {
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()
      render(<CommentForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByRole('textbox'), '댓글')
      await user.click(screen.getByRole('button', { name: '작성' }))

      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('취소', () => {
    it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
      const user = userEvent.setup()
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.click(screen.getByRole('button', { name: '취소' }))

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })
})
