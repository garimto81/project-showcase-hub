import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  DeploymentDetector,
  createDetectedApp,
  type GitHubRepo,
} from '@/lib/deployment-detector'

/**
 * POST /api/github/detect-deployment
 * 개별 레포의 배포 URL을 탐지합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { owner, repo } = body

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'owner와 repo가 필요합니다' },
        { status: 400 }
      )
    }

    // GitHub access token 가져오기
    const { data: identities } = await supabase.auth.getUserIdentities()
    const githubIdentity = identities?.identities?.find(
      (identity) => identity.provider === 'github'
    )

    if (!githubIdentity?.identity_data) {
      return NextResponse.json(
        { error: 'GitHub 계정이 연동되지 않았습니다' },
        { status: 400 }
      )
    }

    // Supabase에서 GitHub access token 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const accessToken = session?.provider_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub access token을 가져올 수 없습니다. 다시 로그인해주세요.' },
        { status: 401 }
      )
    }

    // 레포 정보 가져오기
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: '레포를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const repoData = (await repoResponse.json()) as GitHubRepo

    // 배포 URL 탐지
    const detector = new DeploymentDetector(accessToken)
    const result = await detector.detectDeploymentUrl(repoData)

    if (!result.url) {
      return NextResponse.json({
        detected: false,
        message: '배포된 URL을 찾을 수 없습니다',
      })
    }

    const detectedApp = createDetectedApp(repoData, result)

    return NextResponse.json({
      detected: true,
      app: detectedApp,
    })
  } catch (error) {
    console.error('배포 URL 탐지 오류:', error)
    return NextResponse.json(
      { error: '배포 URL 탐지 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
