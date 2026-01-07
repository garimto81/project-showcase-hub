import { test, expect } from '@playwright/test'

test.describe('수동 앱 추가 다이얼로그', () => {
  test('다이얼로그 열기 및 UI 확인', async ({ page }) => {
    // 1. 로그인 페이지로 이동
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // 2. Admin 로그인
    await page.getByLabel('비밀번호').fill('qwer1234!@')
    await page.getByRole('button', { name: /로그인/i }).click()

    // 로그인 후 리다이렉트 대기
    await page.waitForURL(/\/(projects)?$/, { timeout: 10000 })

    // 3. 프로젝트 페이지로 이동 (수동 추가 버튼이 있는 곳)
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 스크린샷: 프로젝트 페이지 초기 상태
    await page.screenshot({
      path: 'docs/images/manual-add-dialog-1-projects.png',
      fullPage: true
    })

    // 4. "수동 추가" 버튼 찾기
    const manualAddButton = page.getByRole('button', { name: /수동 추가/i })

    // 버튼이 보이는지 확인
    await expect(manualAddButton).toBeVisible({ timeout: 5000 })

    // 5. 버튼 클릭하여 다이얼로그 열기
    await manualAddButton.click()

    // 다이얼로그가 열릴 때까지 대기
    await page.waitForSelector('[data-slot="dialog-content"]', { timeout: 5000 })

    // 스크린샷: 다이얼로그 열린 상태
    await page.screenshot({
      path: 'docs/images/manual-add-dialog-2-opened.png',
      fullPage: true
    })

    // 6. 다이얼로그 요소 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('앱 수동 추가')).toBeVisible()
    await expect(page.getByLabel('앱 이름 *')).toBeVisible()
    await expect(page.getByLabel('앱 URL *')).toBeVisible()
    await expect(page.getByLabel('설명')).toBeVisible()
    await expect(page.getByLabel('썸네일 URL (선택)')).toBeVisible()

    // 7. 폼 입력 테스트
    await page.getByLabel('앱 이름 *').fill('테스트 앱')
    await page.getByLabel('앱 URL *').fill('https://test-app.vercel.app')
    await page.getByLabel('설명').fill('테스트용 앱입니다.')

    // 스크린샷: 폼 입력 상태
    await page.screenshot({
      path: 'docs/images/manual-add-dialog-3-filled.png',
      fullPage: true
    })

    // 8. 취소 버튼으로 닫기
    await page.getByRole('button', { name: '취소' }).click()

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByRole('dialog')).not.toBeVisible()

    console.log('다이얼로그 테스트 성공!')
  })
})
