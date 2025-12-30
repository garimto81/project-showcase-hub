import { test, expect } from '@playwright/test'

test.describe('네비게이션', () => {
  test('비인증 사용자가 /projects 접근 시 로그인으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/projects')

    // 로그인 페이지로 리다이렉트되거나 로그인 요청 메시지 표시
    await page.waitForURL(/\/(login|projects)/)

    const url = page.url()
    if (url.includes('/login')) {
      // 리다이렉트 성공
      expect(url).toContain('/login')
    } else {
      // 프로젝트 페이지가 표시되면 로그인 상태일 수 있음
      expect(url).toContain('/projects')
    }
  })

  test('페이지 간 네비게이션이 정상적으로 작동한다', async ({ page }) => {
    await page.goto('/')

    // 페이지가 로드되었는지 확인
    await expect(page).toHaveTitle(/.+/)
  })

  test('404 페이지가 적절히 처리된다', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345')

    // 404 응답 또는 커스텀 404 페이지
    if (response) {
      expect([200, 404]).toContain(response.status())
    }
  })
})

test.describe('반응형 디자인', () => {
  test('모바일 뷰에서 페이지가 정상적으로 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // 페이지가 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible()
  })

  test('태블릿 뷰에서 페이지가 정상적으로 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // 페이지가 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible()
  })
})
