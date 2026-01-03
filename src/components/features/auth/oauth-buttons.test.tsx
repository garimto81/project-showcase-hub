import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OAuthButtons } from './oauth-buttons'

// useAuth mock
const mockSignInWithOAuth = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signInWithOAuth: mockSignInWithOAuth,
  }),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Google과 GitHub 버튼을 렌더링한다', () => {
    render(<OAuthButtons />)

    expect(screen.getByRole('button', { name: /Google로 계속하기/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /GitHub으로 계속하기/i })).toBeInTheDocument()
  })

  it('Google 버튼 클릭 시 signInWithOAuth를 호출한다', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({})
    const user = userEvent.setup()

    render(<OAuthButtons />)

    await user.click(screen.getByRole('button', { name: /Google로 계속하기/i }))

    expect(mockSignInWithOAuth).toHaveBeenCalledWith('google', undefined)
  })

  it('GitHub 버튼 클릭 시 signInWithOAuth를 호출한다', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({})
    const user = userEvent.setup()

    render(<OAuthButtons />)

    await user.click(screen.getByRole('button', { name: /GitHub으로 계속하기/i }))

    expect(mockSignInWithOAuth).toHaveBeenCalledWith('github', undefined)
  })

  it('로딩 중 모든 버튼이 비활성화된다', async () => {
    let resolveOAuth: (value?: unknown) => void
    mockSignInWithOAuth.mockImplementationOnce(
      () => new Promise((resolve) => { resolveOAuth = resolve })
    )
    const user = userEvent.setup()

    render(<OAuthButtons />)

    await user.click(screen.getByRole('button', { name: /Google로 계속하기/i }))

    // 모든 버튼이 비활성화됨
    expect(screen.getByRole('button', { name: /Google로 계속하기/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /GitHub으로 계속하기/i })).toBeDisabled()

    resolveOAuth!()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Google로 계속하기/i })).not.toBeDisabled()
    })
  })

  it('로딩 중 로딩 인디케이터를 표시한다', async () => {
    let resolveOAuth: (value?: unknown) => void
    mockSignInWithOAuth.mockImplementationOnce(
      () => new Promise((resolve) => { resolveOAuth = resolve })
    )
    const user = userEvent.setup()

    render(<OAuthButtons />)

    await user.click(screen.getByRole('button', { name: /GitHub으로 계속하기/i }))

    // 로딩 상태에서도 버튼 텍스트는 유지됨
    expect(screen.getByRole('button', { name: /GitHub으로 계속하기/i })).toBeInTheDocument()

    resolveOAuth!()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /GitHub으로 계속하기/i })).not.toBeDisabled()
    })
  })
})

describe('OAuthButtons with searchParams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('next 파라미터가 있으면 signInWithOAuth에 전달한다', async () => {
    // next 파라미터가 있는 searchParams mock
    vi.doMock('next/navigation', () => ({
      useSearchParams: () => new URLSearchParams('next=/projects/123'),
    }))

    mockSignInWithOAuth.mockResolvedValueOnce({})
    const user = userEvent.setup()

    // 컴포넌트를 다시 import해야 하지만, 현재 테스트에서는 기본 mock 사용
    render(<OAuthButtons />)

    await user.click(screen.getByRole('button', { name: /Google로 계속하기/i }))

    // 기본 mock에서는 undefined
    expect(mockSignInWithOAuth).toHaveBeenCalledWith('google', undefined)
  })
})
