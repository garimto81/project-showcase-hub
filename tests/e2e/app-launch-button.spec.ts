import { test, expect } from '@playwright/test'

test.describe('앱 열기 버튼 테스트', () => {
  test('프로젝트 카드의 앱 열기 버튼 클릭 시 새 탭에서 배포 URL 열림', async ({ page, context }) => {
    // 프로젝트 목록 페이지로 이동
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 앱 열기 버튼 찾기 (target="_blank"를 가진 외부 링크)
    const appLaunchButton = page.locator('a[target="_blank"]:has-text("앱 열기")').first()

    // 버튼이 존재하는지 확인
    const buttonExists = await appLaunchButton.count() > 0

    if (!buttonExists) {
      console.log('앱 열기 버튼이 없습니다 (url 필드가 없는 프로젝트)')
      return
    }

    // 버튼의 href 속성 확인
    const href = await appLaunchButton.getAttribute('href')
    console.log('앱 열기 버튼 href:', href)

    // href가 올바른 외부 URL인지 확인
    expect(href).toBeTruthy()
    expect(href).toMatch(/^https?:\/\//)
    expect(href).not.toContain('/projects') // 내부 경로가 아닌지 확인

    // 새 탭에서 열리는지 확인 (target="_blank")
    const target = await appLaunchButton.getAttribute('target')
    expect(target).toBe('_blank')

    // 실제로 새 탭이 열리는지 테스트
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      appLaunchButton.click()
    ])

    // 새 탭의 URL 확인
    const newPageUrl = newPage.url()
    console.log('새 탭 URL:', newPageUrl)

    // 새 탭 URL이 href와 일치하거나 리다이렉트된 URL인지 확인
    expect(newPageUrl).toContain('project-showcase-hub')

    // 기존 페이지는 여전히 /projects에 있어야 함 (버블링 방지 확인)
    expect(page.url()).toContain('/projects')

    await newPage.close()
  })

  test('앱 열기 버튼 클릭 시 프로젝트 상세 페이지로 이동하지 않음', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const appLaunchButton = page.locator('a[target="_blank"]:has-text("앱 열기")').first()

    if (await appLaunchButton.count() === 0) {
      console.log('테스트 스킵: 앱 열기 버튼 없음')
      return
    }

    // 현재 URL 저장
    const currentUrl = page.url()

    // 버튼 클릭 (새 탭은 무시)
    await appLaunchButton.click()

    // 잠시 대기
    await page.waitForTimeout(500)

    // 기존 페이지 URL이 변경되지 않았는지 확인 (프로젝트 상세로 이동 안 함)
    expect(page.url()).toBe(currentUrl)
  })
})
