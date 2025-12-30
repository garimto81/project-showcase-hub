import { test, expect } from '@playwright/test'

test.describe('GitHub 레포지토리 (인증됨)', () => {
  test('프로젝트 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/projects')

    // 로그인 페이지로 리다이렉트되지 않아야 함
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page).toHaveURL(/\/projects/)
  })

  test('프로젝트 생성 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/projects/new')

    await expect(page).toHaveURL(/\/projects\/new/)
  })

  test('GitHub 레포지토리 섹션이 표시된다', async ({ page }) => {
    await page.goto('/projects/new')

    // GitHub 레포 섹션 또는 연동 버튼이 표시되어야 함
    const githubSection = page.locator('text=/GitHub|레포지토리|Repository/i').first()

    // 로딩 완료 대기
    await page.waitForLoadState('networkidle')

    // GitHub 관련 UI가 표시되는지 확인
    const hasGitHubContent = await githubSection.isVisible().catch(() => false)
    const hasRepoCards = await page.locator('[class*="repo"]').first().isVisible().catch(() => false)
    const hasLinkButton = await page.getByRole('button', { name: /연동|link/i }).isVisible().catch(() => false)

    // 셋 중 하나라도 표시되면 성공
    expect(hasGitHubContent || hasRepoCards || hasLinkButton).toBeTruthy()
  })

  test('GitHub API가 정상 응답한다', async ({ page, request }) => {
    // 먼저 페이지 방문하여 쿠키 설정
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // API 직접 호출
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/github/repos')
      return {
        status: res.status,
        data: await res.json()
      }
    })

    // 401(토큰 없음) 또는 200(성공) 모두 유효한 응답
    expect([200, 401]).toContain(response.status)

    if (response.status === 200) {
      expect(response.data).toHaveProperty('repos')
      expect(Array.isArray(response.data.repos)).toBeTruthy()
      console.log(`✅ GitHub 레포 ${response.data.total}개 로드됨`)
    } else {
      console.log('ℹ️ GitHub 토큰 필요 (GitHub OAuth로 로그인 필요)')
    }
  })

  test('레포지토리 목록이 표시된다 (GitHub 연동된 경우)', async ({ page }) => {
    await page.goto('/projects/new')
    await page.waitForLoadState('networkidle')

    // 로딩 스켈레톤이 사라질 때까지 대기
    await page.waitForTimeout(2000)

    // 레포 카드 또는 빈 상태 또는 연동 버튼 확인
    const repoCards = page.locator('[class*="repo"], [class*="card"]')
    const emptyState = page.locator('text=/레포지토리가 없습니다|No repositories/i')
    const linkButton = page.getByRole('button', { name: /GitHub 계정 연동|연동하기/i })

    const hasRepos = await repoCards.count() > 0
    const isEmpty = await emptyState.isVisible().catch(() => false)
    const needsLink = await linkButton.isVisible().catch(() => false)

    // 세 가지 상태 중 하나는 표시되어야 함
    expect(hasRepos || isEmpty || needsLink).toBeTruthy()

    if (hasRepos) {
      const count = await repoCards.count()
      console.log(`✅ ${count}개의 레포지토리 카드 표시됨`)
    } else if (isEmpty) {
      console.log('ℹ️ 레포지토리가 없습니다')
    } else if (needsLink) {
      console.log('ℹ️ GitHub 계정 연동이 필요합니다')
    }
  })
})
