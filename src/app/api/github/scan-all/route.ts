import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { DetectedApp } from '@/types/database'

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'garimto81'

interface GitHubRepoResponse {
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  language: string | null
}

/**
 * POST /api/github/scan-all
 * GitHub 공개 API를 사용하여 레포를 스캔하고 배포된 앱을 찾습니다.
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // 세션 기반 인증 확인
    const session = await getSession()
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 공개 API로 레포 목록 가져오기
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Project-Showcase-Hub',
        },
        next: { revalidate: 300 }, // 5분 캐싱
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API 오류: ${response.status}` },
        { status: response.status }
      )
    }

    const repos: GitHubRepoResponse[] = await response.json()

    // 배포된 앱 탐지 (homepage가 있는 레포)
    const detectedApps: DetectedApp[] = repos
      .filter((repo) => repo.homepage && repo.homepage.trim() !== '')
      .map((repo) => ({
        repoFullName: repo.full_name,
        repoName: repo.name,
        description: repo.description,
        url: repo.homepage!,
        source: 'github_homepage' as const,
        confidence: 'high' as const,
        thumbnailUrl: null,
      }))

    // 탐지된 앱을 DB에 저장 (기존 앱은 건너뛰기)
    const savedApps: DetectedApp[] = []
    const existingApps: string[] = []

    for (const app of detectedApps) {
      // 이미 등록된 앱인지 확인 (github_repo로 체크)
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('github_repo', app.repoFullName)
        .single()

      if (existing) {
        existingApps.push(app.repoFullName)
        continue
      }

      // 새 앱 저장
      const { error } = await supabase.from('projects').insert({
        title: app.repoName,
        description: app.description,
        owner_id: null, // 단일 사용자 시스템이므로 null
        thumbnail_url: app.thumbnailUrl,
        url: app.url,
        app_type: 'web_app',
        is_favorite: false,
        github_repo: app.repoFullName,
      })

      if (!error) {
        savedApps.push(app)
      } else {
        console.error(`프로젝트 생성 실패 (${app.repoName}):`, error)
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        totalRepos: repos.length,
        scannedRepos: repos.length,
        detectedApps: detectedApps.length,
        savedApps: savedApps.length,
        existingApps: existingApps.length,
        skippedRepos: repos.length - detectedApps.length,
        errors: 0,
      },
      apps: savedApps,
      skipped: existingApps,
    })
  } catch (error) {
    console.error('레포 스캔 오류:', error)
    return NextResponse.json(
      { error: '레포 스캔 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
