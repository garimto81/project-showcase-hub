import { test, expect } from '@playwright/test'

test.describe('홈페이지', () => {
  test('홈페이지가 /projects로 리다이렉트된다', async ({ page }) => {
    await page.goto('/')

    // 홈페이지는 /projects로 리다이렉트됨 (비인증 시 /login으로 추가 리다이렉트)
    await page.waitForURL(/\/(projects|login)/)
    const url = page.url()
    expect(url).toMatch(/\/(projects|login)/)
  })

  test('로그인 페이지에서 로그인 폼이 표시된다', async ({ page }) => {
    await page.goto('/login')

    // Card 컴포넌트 내의 로그인 제목 확인 (CardTitle)
    await expect(page.locator('[data-slot="card-title"]')).toBeVisible()
  })
})
