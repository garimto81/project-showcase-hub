import { test, expect } from '@playwright/test'

test.describe('Google OAuth 로그인', () => {
  test.describe('로그인 페이지', () => {
    test('Google 로그인 버튼이 표시된다', async ({ page }) => {
      await page.goto('/login')

      const googleButton = page.getByRole('button', { name: /google/i })
      await expect(googleButton).toBeVisible()
      await expect(googleButton).toContainText('Google로 계속하기')
    })

    test('Google 버튼 클릭 시 OAuth 페이지로 리다이렉트된다', async ({ page }) => {
      await page.goto('/login')

      const googleButton = page.getByRole('button', { name: /google/i })

      // 네비게이션 대기 설정
      const navigationPromise = page.waitForURL(/accounts\.google\.com|supabase/, { timeout: 10000 })

      await googleButton.click()

      // Google OAuth 또는 Supabase Auth로 리다이렉트 확인
      await navigationPromise
      const url = page.url()
      expect(url).toMatch(/accounts\.google\.com|supabase/)
    })
  })

  test.describe('회원가입 페이지', () => {
    test('Google 로그인 버튼이 표시된다', async ({ page }) => {
      await page.goto('/signup')

      const googleButton = page.getByRole('button', { name: /google/i })
      await expect(googleButton).toBeVisible()
      await expect(googleButton).toContainText('Google로 계속하기')
    })

    test('Google 버튼 클릭 시 OAuth 페이지로 리다이렉트된다', async ({ page }) => {
      await page.goto('/signup')

      const googleButton = page.getByRole('button', { name: /google/i })

      // 네비게이션 대기 설정
      const navigationPromise = page.waitForURL(/accounts\.google\.com|supabase/, { timeout: 10000 })

      await googleButton.click()

      // Google OAuth 또는 Supabase Auth로 리다이렉트 확인
      await navigationPromise
      const url = page.url()
      expect(url).toMatch(/accounts\.google\.com|supabase/)
    })
  })
})
