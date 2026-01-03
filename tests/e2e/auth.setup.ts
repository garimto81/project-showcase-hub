import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'tests/e2e/.auth/user.json'

/**
 * GitHub OAuth 로그인 설정
 *
 * 실행 방법:
 * npx playwright test --project=setup --headed
 *
 * 이 테스트는 브라우저를 열고 GitHub 로그인을 기다립니다.
 * 수동으로 로그인하면 세션이 저장됩니다.
 */
setup('GitHub 로그인 및 세션 저장', async ({ page }) => {
  // 5분 타임아웃 설정
  setup.setTimeout(300000)
  // 로그인 페이지로 이동
  await page.goto('/login')

  // GitHub 버튼 클릭
  const githubButton = page.getByRole('button', { name: /github/i })
  await expect(githubButton).toBeVisible()
  await githubButton.click()

  // GitHub OAuth 페이지에서 수동 로그인 대기 (5분)
  console.log('\n========================================')
  console.log('GitHub 로그인 페이지가 열렸습니다.')
  console.log('브라우저에서 GitHub 계정으로 로그인해주세요.')
  console.log('로그인 완료 후 자동으로 리다이렉트됩니다.')
  console.log('========================================\n')

  // 로그인 완료 후 /projects 페이지로 리다이렉트될 때까지 대기
  await page.waitForURL('**/projects**', { timeout: 300000 }) // 5분 대기

  // 로그인 성공 확인
  await expect(page).toHaveURL(/\/projects/)
  console.log('\n✅ 로그인 성공! 세션을 저장합니다.\n')

  // 세션 상태 저장
  await page.context().storageState({ path: AUTH_FILE })
})
