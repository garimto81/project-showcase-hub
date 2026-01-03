import { test, expect } from '@playwright/test'

test.describe('인증 페이지', () => {
  test.describe('로그인 페이지', () => {
    test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
      await page.goto('/login')

      // CardTitle "로그인" 확인
      await expect(page.getByText('로그인', { exact: false }).first()).toBeVisible()
    })

    test('이메일과 비밀번호 입력 필드가 있다', async ({ page }) => {
      await page.goto('/login')

      // 이메일 입력 필드 (id="email")
      const emailInput = page.locator('input#email')
      await expect(emailInput).toBeVisible()

      // 비밀번호 입력 필드 (id="password")
      const passwordInput = page.locator('input#password')
      await expect(passwordInput).toBeVisible()
    })

    test('소셜 로그인 버튼이 있다', async ({ page }) => {
      await page.goto('/login')

      // GitHub 또는 Google 로그인 버튼 확인
      const socialButton = page.getByRole('button', { name: /github|google/i })
      const socialButtonCount = await socialButton.count()

      expect(socialButtonCount).toBeGreaterThanOrEqual(1)
    })

    test('회원가입 링크가 있다', async ({ page }) => {
      await page.goto('/login')

      // 회원가입 링크 확인
      const signupLink = page.getByRole('link', { name: /회원가입/i })
      await expect(signupLink).toBeVisible()
    })

    test('폼 제출 버튼이 있다', async ({ page }) => {
      await page.goto('/login')

      const submitButton = page.getByRole('button', { name: /로그인/i })
      await expect(submitButton).toBeVisible()
    })
  })

  test.describe('회원가입 페이지', () => {
    test('회원가입 페이지가 정상적으로 로드된다', async ({ page }) => {
      await page.goto('/signup')

      // CardTitle "회원가입" 확인
      await expect(page.getByText('회원가입', { exact: false }).first()).toBeVisible()
    })

    test('회원가입 폼 필드가 있다', async ({ page }) => {
      await page.goto('/signup')

      // 이메일 입력 필드
      const emailInput = page.locator('input#email')
      await expect(emailInput).toBeVisible()

      // 비밀번호 입력 필드 (id="password")
      const passwordInput = page.locator('input#password')
      await expect(passwordInput).toBeVisible()

      // 비밀번호 확인 필드 (id="confirmPassword")
      const confirmPasswordInput = page.locator('input#confirmPassword')
      await expect(confirmPasswordInput).toBeVisible()
    })

    test('이름 필드가 있다 (선택)', async ({ page }) => {
      await page.goto('/signup')

      const displayNameInput = page.locator('input#displayName')
      await expect(displayNameInput).toBeVisible()
    })

    test('로그인 링크가 있다', async ({ page }) => {
      await page.goto('/signup')

      const loginLink = page.getByRole('link', { name: /로그인/i })
      await expect(loginLink).toBeVisible()
    })
  })
})
