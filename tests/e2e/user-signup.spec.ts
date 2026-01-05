import { test, expect } from '@playwright/test'

/**
 * User 회원가입 및 로그인 통합 테스트
 * 로컬 환경에서 실제 Supabase Auth 기능 검증
 */

test.describe.serial('User 회원가입 및 로그인', () => {
  // 테스트용 임시 계정 정보 (describe 레벨에서 고정)
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'Test123456!'
  const testDisplayName = 'Test User'

  test('User 회원가입 → 자동 로그인 → 대시보드 리다이렉트', async ({ page }) => {
    // 1. 회원가입 페이지 이동
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup/)

    // 2. 회원가입 폼 작성
    await page.locator('input#email').fill(testEmail)
    await page.locator('input#displayName').fill(testDisplayName)
    await page.locator('input#password').fill(testPassword)
    await page.locator('input#confirmPassword').fill(testPassword)

    // 3. 회원가입 버튼 클릭
    await page.getByRole('button', { name: /회원가입/i }).click()

    // 4. 자동 로그인 후 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 })

    // 5. 로그인 상태 확인 (Avatar 버튼 존재 여부)
    const avatarButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') })
    await expect(avatarButton).toBeVisible()
  })

  test('User 로그아웃 후 재로그인', async ({ page }) => {
    // 1. 로그인 페이지 이동
    await page.goto('/login')

    // 2. User 탭 선택
    await page.getByRole('tab', { name: /User/i }).click()

    // 3. 로그인 폼 작성
    await page.locator('input#user-email').fill(testEmail)
    await page.locator('input#user-password').fill(testPassword)

    // 4. 로그인 버튼 클릭
    await page.getByRole('button', { name: /로그인/i }).click()

    // 5. 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 })

    // 6. 로그인 상태 확인
    const avatarButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') })
    await expect(avatarButton).toBeVisible()
  })

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    await page.goto('/login')

    // User 탭 선택
    await page.getByRole('tab', { name: /User/i }).click()

    // 잘못된 비밀번호로 로그인 시도
    await page.locator('input#user-email').fill(testEmail)
    await page.locator('input#user-password').fill('WrongPassword123!')
    await page.getByRole('button', { name: /로그인/i }).click()

    // 에러 메시지 확인
    await expect(page.locator('text=/잘못된|실패|invalid/i')).toBeVisible({ timeout: 5000 })
  })

  test('비밀번호 불일치 시 회원가입 실패', async ({ page }) => {
    await page.goto('/signup')

    await page.locator('input#email').fill(`test2-${Date.now()}@example.com`)
    await page.locator('input#displayName').fill('Test User 2')
    await page.locator('input#password').fill(testPassword)
    await page.locator('input#confirmPassword').fill('DifferentPassword123!')

    await page.getByRole('button', { name: /회원가입/i }).click()

    // 에러 메시지 확인
    await expect(page.locator('text=/일치하지|불일치/i')).toBeVisible()
  })

  test('짧은 비밀번호로 회원가입 실패', async ({ page }) => {
    await page.goto('/signup')

    await page.locator('input#email').fill(`test3-${Date.now()}@example.com`)
    await page.locator('input#displayName').fill('Test User 3')
    await page.locator('input#password').fill('12345')
    await page.locator('input#confirmPassword').fill('12345')

    await page.getByRole('button', { name: /회원가입/i }).click()

    // 에러 메시지 확인
    await expect(page.locator('text=/최소 6자|6자 이상/i')).toBeVisible()
  })
})
