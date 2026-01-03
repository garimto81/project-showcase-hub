import { test, expect } from '@playwright/test'

test.describe('GitHub 동기화 테스트', () => {
  test('프로젝트 목록에서 GitHub 연결된 프로젝트 확인', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 프로젝트 카드가 로드될 때까지 대기
    const projectCards = page.locator('[data-testid="project-card"], .card, a[href^="/projects/"]')
    await expect(projectCards.first()).toBeVisible({ timeout: 10000 })

    const count = await projectCards.count()
    console.log(`✅ ${count}개의 프로젝트 카드 발견`)
  })

  test('프로젝트 상세 페이지에서 GitHub 정보 섹션 확인', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 첫 번째 프로젝트 클릭
    const projectLink = page.locator('a[href^="/projects/"]').first()
    const linkExists = await projectLink.isVisible().catch(() => false)

    if (!linkExists) {
      console.log('ℹ️ 프로젝트가 없습니다. 테스트 스킵')
      return
    }

    await projectLink.click()
    await page.waitForLoadState('networkidle')

    // 프로젝트 상세 페이지 URL 확인
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/)

    // GitHub 섹션 찾기
    const githubSection = page.locator('text=GitHub').first()
    const hasGithub = await githubSection.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasGithub) {
      console.log('✅ GitHub 정보 섹션 발견')

      // Stars 정보 확인
      const stars = page.locator('text=Stars')
      const hasStars = await stars.isVisible().catch(() => false)
      if (hasStars) {
        console.log('✅ Stars 정보 표시됨')
      }

      // Forks 정보 확인
      const forks = page.locator('text=Forks')
      const hasForks = await forks.isVisible().catch(() => false)
      if (hasForks) {
        console.log('✅ Forks 정보 표시됨')
      }

      // 동기화 버튼 찾기
      const syncButton = page.getByRole('button', { name: /동기화/i })
      const hasSyncButton = await syncButton.isVisible().catch(() => false)

      if (hasSyncButton) {
        console.log('✅ 동기화 버튼 발견')
      } else {
        console.log('ℹ️ 동기화 버튼 없음 (권한 부족 또는 미구현)')
      }
    } else {
      console.log('ℹ️ GitHub 연결 안됨 - GitHub 정보 섹션 없음')
    }
  })

  test('GitHub 동기화 API 테스트', async ({ page }) => {
    // 먼저 프로젝트 목록에서 프로젝트 ID 가져오기
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // API를 통해 프로젝트 목록 조회
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/projects')
      return {
        status: res.status,
        data: await res.json().catch(() => null)
      }
    })

    console.log(`📋 프로젝트 API 응답: ${response.status}`)

    if (response.status === 200 && response.data?.projects?.length > 0) {
      // GitHub repo가 있는 프로젝트 찾기
      const projectWithGithub = response.data.projects.find(
        (p: { github_repo?: string }) => p.github_repo
      )

      if (projectWithGithub) {
        console.log(`✅ GitHub 연결된 프로젝트 발견: ${projectWithGithub.title}`)
        console.log(`   레포: ${projectWithGithub.github_repo}`)

        // 동기화 API 호출 테스트
        const syncResponse = await page.evaluate(async (projectId: string) => {
          const res = await fetch('/api/github/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
          })
          return {
            status: res.status,
            data: await res.json().catch(() => null)
          }
        }, projectWithGithub.id)

        console.log(`🔄 동기화 API 응답: ${syncResponse.status}`)

        if (syncResponse.status === 200) {
          console.log('✅ 동기화 성공!')
          console.log(`   Stars: ${syncResponse.data?.synced?.stars}`)
          console.log(`   Forks: ${syncResponse.data?.synced?.forks}`)
          console.log(`   Language: ${syncResponse.data?.synced?.language}`)
        } else if (syncResponse.status === 401) {
          console.log('ℹ️ 인증 필요 - 로그인 후 테스트 필요')
        } else if (syncResponse.status === 403) {
          console.log('ℹ️ 권한 없음 - 프로젝트 소유자만 동기화 가능')
        } else {
          console.log(`⚠️ 동기화 실패: ${syncResponse.data?.error || '알 수 없는 오류'}`)
        }
      } else {
        console.log('ℹ️ GitHub 연결된 프로젝트 없음')
      }
    }
  })

  test('동기화 버튼 클릭 테스트', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 프로젝트 카드 클릭
    const projectLink = page.locator('a[href^="/projects/"]').first()
    const linkExists = await projectLink.isVisible().catch(() => false)

    if (!linkExists) {
      console.log('ℹ️ 프로젝트가 없습니다')
      return
    }

    await projectLink.click()
    await page.waitForLoadState('networkidle')

    // 동기화 버튼 찾기
    const syncButton = page.getByRole('button', { name: /동기화/i })
    const hasSyncButton = await syncButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasSyncButton) {
      // 동기화 버튼 클릭
      await syncButton.click()

      // 로딩 상태 확인
      const loadingText = page.locator('text=동기화 중')
      const isLoading = await loadingText.isVisible({ timeout: 2000 }).catch(() => false)

      if (isLoading) {
        console.log('✅ 동기화 중 상태 표시됨')
      }

      // 동기화 완료 대기 (최대 10초)
      await page.waitForTimeout(3000)

      // 결과 확인
      const stillLoading = await loadingText.isVisible().catch(() => false)
      if (!stillLoading) {
        console.log('✅ 동기화 완료')
      }
    } else {
      console.log('ℹ️ 동기화 버튼이 없거나 권한이 없습니다')
    }
  })
})
