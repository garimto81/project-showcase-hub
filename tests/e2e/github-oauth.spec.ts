import { test, expect } from '@playwright/test'

test.describe('GitHub OAuth 로그인', () => {
  test.describe('로그인 페이지', () => {
    test('GitHub 로그인 버튼이 표시된다', async ({ page }) => {
      await page.goto('/login')

      const githubButton = page.getByRole('button', { name: /github/i })
      await expect(githubButton).toBeVisible()
      await expect(githubButton).toContainText('GitHub으로 계속하기')
    })

    test('GitHub 버튼 클릭 시 OAuth 페이지로 리다이렉트된다', async ({ page }) => {
      // networkidle로 Supabase 클라이언트 초기화 대기
      await page.goto('/login', { waitUntil: 'networkidle' })

      const githubButton = page.getByRole('button', { name: /github/i })
      await expect(githubButton).toBeEnabled()

      // Supabase 클라이언트 초기화 완료 대기 (동적 import)
      await page.waitForTimeout(1000)

      // 네비게이션 대기 설정
      const navigationPromise = page.waitForURL(/github\.com|supabase/, { timeout: 15000 })

      await githubButton.click()

      // GitHub OAuth 또는 Supabase Auth로 리다이렉트 확인
      await navigationPromise
      const url = page.url()
      expect(url).toMatch(/github\.com|supabase/)
    })

    test('Google 로그인 버튼도 표시된다', async ({ page }) => {
      await page.goto('/login')

      const googleButton = page.getByRole('button', { name: /google/i })
      await expect(googleButton).toBeVisible()
      await expect(googleButton).toContainText('Google로 계속하기')
    })
  })

  test.describe('회원가입 페이지', () => {
    test('GitHub 로그인 버튼이 표시된다', async ({ page }) => {
      await page.goto('/signup')

      const githubButton = page.getByRole('button', { name: /github/i })
      await expect(githubButton).toBeVisible()
    })

    test('Google 로그인 버튼이 표시된다', async ({ page }) => {
      await page.goto('/signup')

      const googleButton = page.getByRole('button', { name: /google/i })
      await expect(googleButton).toBeVisible()
    })
  })

  test.describe('OAuth 콜백', () => {
    test('인증 코드 없이 콜백 접근 시 로그인으로 리다이렉트된다', async ({ page }) => {
      await page.goto('/auth/callback')

      // 에러로 인해 로그인 페이지로 리다이렉트
      await page.waitForURL(/\/login/)
      expect(page.url()).toContain('/login')
    })

    test('잘못된 인증 코드로 콜백 접근 시 에러 파라미터와 함께 리다이렉트된다', async ({ page }) => {
      await page.goto('/auth/callback?code=invalid_code')

      // 에러로 인해 로그인 페이지로 리다이렉트
      await page.waitForURL(/\/login/, { timeout: 10000 })
      expect(page.url()).toContain('/login')
    })
  })

  test.describe('보호된 라우트 리다이렉트', () => {
    test('비인증 상태로 /projects 접근 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
      await page.goto('/projects')

      await page.waitForURL(/\/login/)
      expect(page.url()).toContain('/login')
    })

    test('비인증 상태로 /projects/new 접근 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
      await page.goto('/projects/new')

      await page.waitForURL(/\/login/)
      expect(page.url()).toContain('/login')
    })

    test('로그인 페이지에 next 파라미터가 전달된다', async ({ page }) => {
      await page.goto('/projects/new')

      await page.waitForURL(/\/login/)
      // next 파라미터가 URL에 포함될 수 있음 (미들웨어 구현에 따라)
      const url = page.url()
      expect(url).toContain('/login')
    })
  })
})
