import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RepoScanner } from '@/lib/repo-scanner'
import type { DetectedApp } from '@/types/database'

/**
 * POST /api/github/scan-all
 * 사용자의 모든 GitHub 레포를 스캔하여 배포된 앱을 찾습니다.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // GitHub access token 가져오기
    const { data: identities } = await supabase.auth.getUserIdentities()
    const githubIdentity = identities?.identities?.find(
      (identity) => identity.provider === 'github'
    )

    if (!githubIdentity?.identity_data) {
      return NextResponse.json(
        { error: 'GitHub 계정이 연동되지 않았습니다', needsGithubLink: true },
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
        {
          error: 'GitHub access token을 가져올 수 없습니다. 다시 로그인해주세요.',
          needsReauth: true,
        },
        { status: 401 }
      )
    }

    // 레포 스캔 시작
    const scanner = new RepoScanner(accessToken)
    const scanResult = await scanner.scanAllRepos()

    // 탐지된 앱을 DB에 저장 (기존 앱은 건너뛰기)
    const savedApps: DetectedApp[] = []
    const existingApps: string[] = []

    for (const app of scanResult.detectedApps) {
      // 이미 등록된 앱인지 확인 (github_repo로 체크)
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('github_repo', app.repoFullName)
        .eq('owner_id', user.id)
        .single()

      if (existing) {
        existingApps.push(app.repoFullName)
        continue
      }

      // 새 앱 저장
      const { error } = await supabase.from('projects').insert({
        title: app.repoName,
        description: app.description,
        owner_id: user.id,
        thumbnail_url: app.thumbnailUrl,
        url: app.url,
        app_type: 'web_app',
        is_favorite: false,
        github_repo: app.repoFullName,
      })

      if (!error) {
        savedApps.push(app)
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        totalRepos: scanResult.totalRepos,
        scannedRepos: scanResult.scannedRepos,
        detectedApps: scanResult.detectedApps.length,
        savedApps: savedApps.length,
        existingApps: existingApps.length,
        skippedRepos: scanResult.skippedRepos.length,
        errors: scanResult.errors.length,
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
