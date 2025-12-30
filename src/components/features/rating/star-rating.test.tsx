import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarRating } from './star-rating'

describe('StarRating', () => {
  describe('렌더링', () => {
    it('5개의 별 버튼을 렌더링한다', () => {
      render(<StarRating value={0} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })

    it('각 별에 접근성 레이블이 있다', () => {
      render(<StarRating value={0} />)

      expect(screen.getByLabelText('1점')).toBeInTheDocument()
      expect(screen.getByLabelText('2점')).toBeInTheDocument()
      expect(screen.getByLabelText('3점')).toBeInTheDocument()
      expect(screen.getByLabelText('4점')).toBeInTheDocument()
      expect(screen.getByLabelText('5점')).toBeInTheDocument()
    })

    it('showValue가 true면 점수를 표시한다', () => {
      render(<StarRating value={3.5} showValue />)

      expect(screen.getByText('3.5')).toBeInTheDocument()
    })

    it('showValue가 false면 점수를 표시하지 않는다', () => {
      render(<StarRating value={3.5} showValue={false} />)

      expect(screen.queryByText('3.5')).not.toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('별을 클릭하면 onChange가 호출된다', () => {
      const onChange = vi.fn()
      render(<StarRating value={0} onChange={onChange} />)

      fireEvent.click(screen.getByLabelText('3점'))

      expect(onChange).toHaveBeenCalledWith(3)
    })

    it('readonly일 때 버튼이 비활성화된다', () => {
      render(<StarRating value={3} readonly />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })

    it('readonly일 때 클릭해도 onChange가 호출되지 않는다', () => {
      const onChange = vi.fn()
      render(<StarRating value={3} readonly onChange={onChange} />)

      fireEvent.click(screen.getByLabelText('4점'))

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('value에 따른 별 상태', () => {
    it('value가 0이면 모든 별이 비어있다', () => {
      render(<StarRating value={0} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        const star = button.querySelector('svg')
        expect(star).toHaveClass('fill-transparent')
      })
    })

    it('value가 3이면 처음 3개 별이 채워진다', () => {
      render(<StarRating value={3} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button, index) => {
        const star = button.querySelector('svg')
        if (index < 3) {
          expect(star).toHaveClass('fill-yellow-400')
        } else {
          expect(star).toHaveClass('fill-transparent')
        }
      })
    })

    it('value가 5이면 모든 별이 채워진다', () => {
      render(<StarRating value={5} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        const star = button.querySelector('svg')
        expect(star).toHaveClass('fill-yellow-400')
      })
    })
  })

  describe('사이즈 옵션', () => {
    it('기본 사이즈는 md이다', () => {
      render(<StarRating value={3} />)

      const star = screen.getByLabelText('1점').querySelector('svg')
      expect(star).toHaveClass('size-5')
    })

    it('sm 사이즈를 적용할 수 있다', () => {
      render(<StarRating value={3} size="sm" />)

      const star = screen.getByLabelText('1점').querySelector('svg')
      expect(star).toHaveClass('size-4')
    })

    it('lg 사이즈를 적용할 수 있다', () => {
      render(<StarRating value={3} size="lg" />)

      const star = screen.getByLabelText('1점').querySelector('svg')
      expect(star).toHaveClass('size-6')
    })
  })
})
