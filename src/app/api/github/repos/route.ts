import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'garimto81'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  visibility: string
  owner: {
    login: string
    avatar_url: string
  }
}

export async function GET() {
  // 세션 기반 인증 확인
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  try {
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

    const repos: GitHubRepo[] = await response.json()

    return NextResponse.json({
      repos,
      total: repos.length,
    })
  } catch (error) {
    console.error('[API] GET /api/github/repos error:', error)
    return NextResponse.json(
      { error: 'GitHub 레포지토리를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
