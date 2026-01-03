import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignupForm } from './signup-form'

// Auth context mock
const mockSignUp = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// OAuthButtons mock
vi.mock('./oauth-buttons', () => ({
  OAuthButtons: () => <div data-testid="oauth-buttons">OAuth Buttons</div>,
}))

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('회원가입 폼을 렌더링한다', () => {
    render(<SignupForm />)

    expect(screen.getByLabelText(/이름/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^비밀번호$/)).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호 확인/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /회원가입/i })).toBeInTheDocument()
  })

  it('OAuth 버튼을 렌더링한다', () => {
    render(<SignupForm />)

    expect(screen.getByTestId('oauth-buttons')).toBeInTheDocument()
  })

  it('로그인 링크를 렌더링한다', () => {
    render(<SignupForm />)

    const loginLink = screen.getByRole('link', { name: /로그인/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('비밀번호가 일치하지 않으면 에러를 표시한다', async () => {
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'different')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('비밀번호가 6자 미만이면 에러를 표시한다', async () => {
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), '12345')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), '12345')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(screen.getByText(/비밀번호는 최소 6자 이상이어야 합니다/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('회원가입 성공 시 이메일 확인 메시지를 표시한다', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(screen.getByText(/이메일 확인/i)).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
    })
  })

  it('회원가입 성공 후 로그인 페이지로 이동 버튼을 제공한다', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /로그인 페이지로 이동/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /로그인 페이지로 이동/i }))

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('회원가입 실패 시 에러 메시지를 표시한다', async () => {
    mockSignUp.mockResolvedValueOnce({
      error: { message: '이미 등록된 이메일입니다' },
    })
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(screen.getByText(/이미 등록된 이메일입니다/i)).toBeInTheDocument()
    })
  })

  it('제출 중 폼이 비활성화된다', async () => {
    let resolveSignUp: (value: { error: null }) => void
    mockSignUp.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSignUp = resolve })
    )
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    expect(screen.getByRole('button', { name: /가입 중/i })).toBeDisabled()
    expect(screen.getByLabelText(/이메일/i)).toBeDisabled()
    expect(screen.getByLabelText(/^비밀번호$/)).toBeDisabled()
    expect(screen.getByLabelText(/비밀번호 확인/i)).toBeDisabled()

    resolveSignUp!({ error: null })

    await waitFor(() => {
      expect(screen.getByText(/이메일 확인/i)).toBeInTheDocument()
    })
  })

  it('이름(선택) 필드와 함께 가입할 수 있다', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이름/i), '홍길동')
    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', '홍길동')
    })
  })

  it('이름 없이도 가입할 수 있다', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', undefined)
    })
  })

  it('빈 이메일로는 제출되지 않는다', async () => {
    const user = userEvent.setup()

    render(<SignupForm />)

    await user.type(screen.getByLabelText(/^비밀번호$/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/i), 'password123')
    await user.click(screen.getByRole('button', { name: /회원가입/i }))

    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
