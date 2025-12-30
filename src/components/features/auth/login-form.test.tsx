import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from './login-form'

// Auth context mock
const mockSignIn = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// OAuthButtons mock
vi.mock('./oauth-buttons', () => ({
  OAuthButtons: () => <div data-testid="oauth-buttons">OAuth Buttons</div>,
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument()
  })

  it('shows OAuth buttons', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('oauth-buttons')).toBeInTheDocument()
  })

  it('shows signup link', () => {
    render(<LoginForm />)

    const signupLink = screen.getByRole('link', { name: /회원가입/i })
    expect(signupLink).toHaveAttribute('href', '/signup')
  })

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/비밀번호/i), 'password123')
    await user.click(screen.getByRole('button', { name: /로그인/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/projects')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows error message on login failure', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: { message: '잘못된 이메일 또는 비밀번호입니다' },
    })
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/비밀번호/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /로그인/i }))

    await waitFor(() => {
      expect(screen.getByText(/잘못된 이메일 또는 비밀번호입니다/i)).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    // 지연된 signIn을 시뮬레이션
    let resolveSignIn: (value: { error: null }) => void
    mockSignIn.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSignIn = resolve })
    )
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/비밀번호/i), 'password123')
    await user.click(screen.getByRole('button', { name: /로그인/i }))

    // 제출 중 상태 확인
    expect(screen.getByRole('button', { name: /로그인 중/i })).toBeDisabled()
    expect(screen.getByLabelText(/이메일/i)).toBeDisabled()
    expect(screen.getByLabelText(/비밀번호/i)).toBeDisabled()

    // Promise 해결
    resolveSignIn!({ error: null })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })

  it('does not submit form with empty email', async () => {
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/비밀번호/i), 'password123')
    await user.click(screen.getByRole('button', { name: /로그인/i }))

    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('does not submit form with empty password', async () => {
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /로그인/i }))

    expect(mockSignIn).not.toHaveBeenCalled()
  })
})
