import { test, expect } from '@playwright/test'

test.describe('GitHub 동기화 스모크 테스트', () => {
  test('프로젝트 목록 페이지 로드', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 페이지가 로드되었는지 확인
    const title = await page.title()
    console.log(`📄 페이지 타이틀: ${title}`)

    // 프로젝트 카드 또는 빈 상태 확인
    const hasContent = await page.locator('main').isVisible()
    expect(hasContent).toBeTruthy()
    console.log('✅ 메인 콘텐츠 로드 완료')
  })

  test('GitHub 연결된 프로젝트 API 조회', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // API로 프로젝트 목록 조회
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/projects')
      return {
        status: res.status,
        data: await res.json().catch(() => null),
      }
    })

    console.log(`📋 API 응답 상태: ${response.status}`)

    if (response.status === 200 && response.data?.projects) {
      const projects = response.data.projects
      console.log(`📦 전체 프로젝트: ${projects.length}개`)

      const githubProjects = projects.filter((p: { github_repo?: string }) => p.github_repo)
      console.log(`🐙 GitHub 연결된 프로젝트: ${githubProjects.length}개`)

      if (githubProjects.length > 0) {
        const first = githubProjects[0]
        console.log(`   - ${first.title}: ${first.github_repo}`)
      }
    }
  })

  test('프로젝트 상세 페이지에서 GitHub 섹션 확인', async ({ page }) => {
    // API로 GitHub 연결된 프로젝트 찾기
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) return null
      return res.json()
    })

    if (!response?.projects?.length) {
      console.log('ℹ️ 프로젝트가 없습니다')
      return
    }

    const githubProject = response.projects.find((p: { github_repo?: string }) => p.github_repo)

    if (!githubProject) {
      console.log('ℹ️ GitHub 연결된 프로젝트가 없습니다')
      return
    }

    // 프로젝트 상세 페이지로 이동
    await page.goto(`/projects/${githubProject.id}`)
    await page.waitForLoadState('networkidle')

    console.log(`📄 프로젝트: ${githubProject.title}`)
    console.log(`🔗 GitHub: ${githubProject.github_repo}`)

    // GitHub 섹션 확인
    const githubCard = page.locator('text=GitHub').first()
    const hasGithub = await githubCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasGithub) {
      console.log('✅ GitHub 정보 섹션 표시됨')

      // 동기화 버튼 확인
      const syncButton = page.getByRole('button', { name: /동기화/i })
      const hasSyncButton = await syncButton.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasSyncButton) {
        console.log('✅ 동기화 버튼 표시됨')

        // 스크린샷 저장
        await page.screenshot({ path: 'test-results/github-sync-button.png' })
        console.log('📸 스크린샷 저장: test-results/github-sync-button.png')
      } else {
        console.log('⚠️ 동기화 버튼 없음 (로그인 필요 또는 권한 없음)')
      }
    } else {
      console.log('⚠️ GitHub 정보 섹션 없음')
    }
  })
})
