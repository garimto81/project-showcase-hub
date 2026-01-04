import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { ProjectStatus } from '@/types/database'

interface GitHubRepoResponse {
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  pushed_at: string
}

// 프로젝트 상태 자동 판단
function determineProjectStatus(lastPushedAt: string | null): ProjectStatus {
  if (!lastPushedAt) return 'unknown'

  const lastPush = new Date(lastPushedAt)
  const now = new Date()
  const daysSinceLastPush = (now.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceLastPush < 30) return 'active' // 30일 이내
  if (daysSinceLastPush < 180) return 'maintained' // 6개월 이내
  return 'archived' // 6개월 초과
}

// POST /api/github/sync
// 프로젝트의 github_repo 필드를 기반으로 GitHub 정보 동기화
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 세션 기반 인증 확인
    const session = await getSession()
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId }: { projectId: string } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId가 필요합니다' }, { status: 400 })
    }

    // 프로젝트 조회 (단일 사용자이므로 소유권 체크 불필요)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, github_repo')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (!project.github_repo) {
      return NextResponse.json({ error: 'GitHub 레포지토리가 연결되지 않았습니다' }, { status: 400 })
    }

    // GitHub API 호출
    const githubResponse = await fetch(`https://api.github.com/repos/${project.github_repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Project-Showcase-Hub',
      },
    })

    if (!githubResponse.ok) {
      return NextResponse.json(
        { error: 'GitHub API 호출 실패', details: await githubResponse.text() },
        { status: githubResponse.status }
      )
    }

    const repoData: GitHubRepoResponse = await githubResponse.json()

    // 상태 자동 판단
    const status = determineProjectStatus(repoData.pushed_at)

    // 메타데이터 업데이트 (upsert)
    const { data: metadata, error: upsertError } = await supabase
      .from('project_metadata')
      .upsert(
        {
          project_id: projectId,
          github_stars: repoData.stargazers_count,
          github_forks: repoData.forks_count,
          github_language: repoData.language,
          github_topics: repoData.topics || [],
          github_last_pushed_at: repoData.pushed_at,
          github_last_synced_at: new Date().toISOString(),
          status,
        },
        {
          onConflict: 'project_id',
        }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('메타데이터 업데이트 오류:', upsertError)
      return NextResponse.json({ error: '메타데이터 업데이트 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      metadata,
      synced: {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        topics: repoData.topics,
        lastPushedAt: repoData.pushed_at,
        status,
      },
    })
  } catch (error) {
    console.error('GitHub 동기화 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
