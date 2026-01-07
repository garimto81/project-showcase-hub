import { test } from '@playwright/test'

// 디버그용 테스트 - 필요 시 수동 실행
test.skip('디버그: 앱 열기 버튼 HTML 확인', async ({ page }) => {
  await page.goto('/projects')
  await page.waitForLoadState('networkidle')

  // 모든 "앱 열기" 텍스트를 포함하는 요소 찾기
  const allAppButtons = await page.locator('text=앱 열기').all()
  console.log('앱 열기 텍스트 포함 요소 수:', allAppButtons.length)

  for (let i = 0; i < allAppButtons.length; i++) {
    const button = allAppButtons[i]
    const tagName = await button.evaluate(el => el.tagName)
    const href = await button.evaluate(el => (el as HTMLAnchorElement).href || 'N/A')
    const target = await button.evaluate(el => (el as HTMLAnchorElement).target || 'N/A')
    const outerHTML = await button.evaluate(el => el.outerHTML)

    console.log(`\n--- 요소 ${i + 1} ---`)
    console.log('태그:', tagName)
    console.log('href:', href)
    console.log('target:', target)
    console.log('HTML:', outerHTML.substring(0, 300))
  }

  // 첫 번째 카드의 전체 HTML 확인
  const firstCard = page.locator('[class*="card"]').first()
  const cardHTML = await firstCard.evaluate(el => el.innerHTML)
  console.log('\n--- 첫 번째 카드 HTML (일부) ---')
  console.log(cardHTML.substring(0, 1000))
})
