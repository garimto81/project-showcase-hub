import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewModeSwitcher, type ViewMode } from './view-mode-switcher'

describe('ViewModeSwitcher', () => {
  const defaultProps = {
    currentMode: 'gallery' as ViewMode,
    onModeChange: vi.fn(),
  }

  describe('렌더링', () => {
    it('4개의 뷰 모드 버튼을 렌더링한다', () => {
      render(<ViewModeSwitcher {...defaultProps} />)

      expect(screen.getByRole('button', { name: /갤러리/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /목록/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /보드/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /타임라인/i })).toBeInTheDocument()
    })

    it('현재 모드에 해당하는 버튼에 활성 스타일이 적용된다', () => {
      render(<ViewModeSwitcher currentMode="list" onModeChange={vi.fn()} />)

      const listButton = screen.getByRole('button', { name: /목록/i })
      expect(listButton).toHaveClass('bg-background')
    })

    it('비활성 버튼에는 활성 스타일이 적용되지 않는다', () => {
      render(<ViewModeSwitcher currentMode="gallery" onModeChange={vi.fn()} />)

      const listButton = screen.getByRole('button', { name: /목록/i })
      expect(listButton).not.toHaveClass('bg-background')
    })
  })

  describe('상호작용', () => {
    it('갤러리 버튼 클릭 시 gallery 모드로 변경한다', () => {
      const onModeChange = vi.fn()
      render(<ViewModeSwitcher currentMode="list" onModeChange={onModeChange} />)

      fireEvent.click(screen.getByRole('button', { name: /갤러리/i }))

      expect(onModeChange).toHaveBeenCalledWith('gallery')
    })

    it('목록 버튼 클릭 시 list 모드로 변경한다', () => {
      const onModeChange = vi.fn()
      render(<ViewModeSwitcher currentMode="gallery" onModeChange={onModeChange} />)

      fireEvent.click(screen.getByRole('button', { name: /목록/i }))

      expect(onModeChange).toHaveBeenCalledWith('list')
    })

    it('보드 버튼 클릭 시 board 모드로 변경한다', () => {
      const onModeChange = vi.fn()
      render(<ViewModeSwitcher currentMode="gallery" onModeChange={onModeChange} />)

      fireEvent.click(screen.getByRole('button', { name: /보드/i }))

      expect(onModeChange).toHaveBeenCalledWith('board')
    })

    it('타임라인 버튼 클릭 시 timeline 모드로 변경한다', () => {
      const onModeChange = vi.fn()
      render(<ViewModeSwitcher currentMode="gallery" onModeChange={onModeChange} />)

      fireEvent.click(screen.getByRole('button', { name: /타임라인/i }))

      expect(onModeChange).toHaveBeenCalledWith('timeline')
    })
  })

  describe('모든 뷰 모드', () => {
    const viewModes: ViewMode[] = ['gallery', 'list', 'board', 'timeline']

    viewModes.forEach((mode) => {
      it(`${mode} 모드가 활성화되면 해당 버튼이 활성 스타일을 가진다`, () => {
        render(<ViewModeSwitcher currentMode={mode} onModeChange={vi.fn()} />)

        const buttons = screen.getAllByRole('button')
        const activeButton = buttons.find((button) =>
          button.classList.contains('bg-background')
        )

        expect(activeButton).toBeDefined()
      })
    })
  })
})
