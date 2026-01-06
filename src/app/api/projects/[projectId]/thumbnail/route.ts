import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, apiError, apiSuccess } from '@/lib/api/utils'

// POST: 썸네일 자동 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  // Admin 권한 확인
  const authResult = await requireAdmin()
  if (authResult.error) return authResult.error

  const supabase = await createClient()

  // 프로젝트 정보 조회
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('url, github_repo')
    .eq('id', projectId)
    .single()

  if (fetchError || !project) {
    return apiError.notFound('프로젝트를 찾을 수 없습니다')
  }

  let thumbnailUrl: string | null = null

  // 1. GitHub repo가 있으면 GitHub Open Graph 이미지 사용
  if (project.github_repo) {
    thumbnailUrl = `https://opengraph.githubassets.com/1/${project.github_repo}`
  }
  // 2. 배포 URL이 있으면 microlink API로 스크린샷 캡처
  else if (project.url) {
    try {
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(project.url)}&screenshot=true&meta=false&embed=screenshot.url`
      const response = await fetch(microlinkUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.data?.screenshot?.url) {
          thumbnailUrl = data.data.screenshot.url
        }
      }
    } catch {
      // microlink 실패 시 무시하고 fallback 사용
    }
  }

  // 3. 아무 소스도 없으면 에러
  if (!thumbnailUrl) {
    return apiError.badRequest('썸네일을 생성할 수 없습니다. GitHub 레포지토리 또는 배포 URL을 먼저 입력해주세요.')
  }

  // 프로젝트 thumbnail_url 업데이트
  const { data: updated, error: updateError } = await supabase
    .from('projects')
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', projectId)
    .select()
    .single()

  if (updateError) {
    return apiError.serverError(updateError.message)
  }

  return apiSuccess.ok({
    thumbnail_url: thumbnailUrl,
    source: project.github_repo ? 'github' : 'screenshot',
    project: updated,
  })
}

// GET: 썸네일 미리보기 (저장 안함)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  // 프로젝트 정보 조회
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('url, github_repo')
    .eq('id', projectId)
    .single()

  if (fetchError || !project) {
    return apiError.notFound('프로젝트를 찾을 수 없습니다')
  }

  let previewUrl: string | null = null
  let source: 'github' | 'screenshot' | null = null

  if (project.github_repo) {
    previewUrl = `https://opengraph.githubassets.com/1/${project.github_repo}`
    source = 'github'
  } else if (project.url) {
    previewUrl = `https://api.microlink.io/?url=${encodeURIComponent(project.url)}&screenshot=true&meta=false&embed=screenshot.url`
    source = 'screenshot'
  }

  if (!previewUrl) {
    return apiError.badRequest('썸네일을 미리볼 수 없습니다. GitHub 레포지토리 또는 배포 URL을 먼저 입력해주세요.')
  }

  return NextResponse.json({
    preview_url: previewUrl,
    source,
  })
}
