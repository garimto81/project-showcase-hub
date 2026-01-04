import { test } from '@playwright/test'

test('디버그: 전체 HTML 덤프', async ({ page }) => {
  await page.goto('/projects')
  await page.waitForLoadState('networkidle')

  // 전체 페이지 HTML에서 "앱 열기" 부분 검색
  const html = await page.content()

  // "앱 열기" 주변 HTML 찾기
  const index = html.indexOf('앱 열기')
  if (index > 0) {
    const start = Math.max(0, index - 500)
    const end = Math.min(html.length, index + 200)
    console.log('\n=== "앱 열기" 주변 HTML ===\n')
    console.log(html.substring(start, end))
  } else {
    console.log('앱 열기 텍스트를 찾을 수 없습니다')
  }
})
