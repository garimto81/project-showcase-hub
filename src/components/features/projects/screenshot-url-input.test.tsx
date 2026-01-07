import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScreenshotUrlInput } from './screenshot-url-input'

describe('ScreenshotUrlInput', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('빈 상태에서 안내 메시지를 표시한다', () => {
    render(<ScreenshotUrlInput value={[]} onChange={mockOnChange} />)

    expect(screen.getByText(/프로젝트 스크린샷 URL을 추가하세요/)).toBeInTheDocument()
  })

  it('유효한 URL을 추가할 수 있다', async () => {
    const user = userEvent.setup()
    render(<ScreenshotUrlInput value={[]} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('https://example.com/screenshot.png')
    await user.type(input, 'https://example.com/image.png')

    const addButton = screen.getByRole('button', { name: '스크린샷 URL 추가' })
    await user.click(addButton)

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/image.png'])
  })

  it('Enter 키로 URL을 추가할 수 있다', async () => {
    const user = userEvent.setup()
    render(<ScreenshotUrlInput value={[]} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('https://example.com/screenshot.png')
    await user.type(input, 'https://example.com/image.png{Enter}')

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/image.png'])
  })

  it('유효하지 않은 URL은 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    render(<ScreenshotUrlInput value={[]} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('https://example.com/screenshot.png')
    await user.type(input, 'invalid-url')

    const addButton = screen.getByRole('button', { name: '스크린샷 URL 추가' })
    await user.click(addButton)

    expect(screen.getByRole('alert')).toHaveTextContent('유효한 URL을 입력해주세요')
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('중복 URL은 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    const existingUrl = 'https://example.com/existing.png'
    render(<ScreenshotUrlInput value={[existingUrl]} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('https://example.com/screenshot.png')
    await user.type(input, existingUrl)

    const addButton = screen.getByRole('button', { name: '스크린샷 URL 추가' })
    await user.click(addButton)

    expect(screen.getByRole('alert')).toHaveTextContent('이미 추가된 URL입니다')
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('기존 스크린샷 목록을 표시한다', () => {
    const urls = [
      'https://example.com/image1.png',
      'https://example.com/image2.png',
    ]
    render(<ScreenshotUrlInput value={urls} onChange={mockOnChange} />)

    expect(screen.getByAltText('스크린샷 1')).toBeInTheDocument()
    expect(screen.getByAltText('스크린샷 2')).toBeInTheDocument()
  })

  it('스크린샷을 삭제할 수 있다', async () => {
    const user = userEvent.setup()
    const urls = [
      'https://example.com/image1.png',
      'https://example.com/image2.png',
    ]
    render(<ScreenshotUrlInput value={urls} onChange={mockOnChange} />)

    const deleteButton = screen.getByRole('button', { name: '스크린샷 1 삭제' })
    await user.click(deleteButton)

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/image2.png'])
  })

  it('disabled 상태에서는 입력이 비활성화된다', () => {
    render(<ScreenshotUrlInput value={[]} onChange={mockOnChange} disabled />)

    const input = screen.getByPlaceholderText('https://example.com/screenshot.png')
    expect(input).toBeDisabled()

    const addButton = screen.getByRole('button', { name: '스크린샷 URL 추가' })
    expect(addButton).toBeDisabled()
  })

  it('빈 URL은 추가되지 않는다', async () => {
    const user = userEvent.setup()
    render(<ScreenshotUrlInput value={[]} onChange={mockOnChange} />)

    const addButton = screen.getByRole('button', { name: '스크린샷 URL 추가' })
    await user.click(addButton)

    expect(mockOnChange).not.toHaveBeenCalled()
  })
})
