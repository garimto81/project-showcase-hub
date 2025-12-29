import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
  // 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  // GitHub 토큰 가져오기
  const cookieStore = await cookies()
  const githubToken = cookieStore.get('github_token')?.value

  if (!githubToken) {
    return NextResponse.json(
      { error: 'GitHub 토큰이 없습니다. GitHub으로 다시 로그인해주세요.' },
      { status: 401 }
    )
  }

  try {
    // GitHub API로 레포지토리 가져오기
    const response = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=100',
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Project-Showcase-Hub',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'GitHub 토큰이 만료되었습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
      }
      throw new Error(`GitHub API error: ${response.status}`)
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
