/**
 * 썸네일 자동 생성 유틸리티
 *
 * 프로젝트 URL에서 썸네일을 자동 생성합니다.
 * Vercel 서버리스 환경에서 동작하도록 Microlink API 사용
 */

interface ThumbnailResult {
  url: string | null
  source: 'github' | 'screenshot' | null
}

/**
 * GitHub 레포지토리 또는 배포 URL에서 썸네일 URL 생성
 *
 * @param githubRepo - GitHub 레포지토리 (예: "owner/repo")
 * @param deployUrl - 배포된 앱 URL
 * @returns 썸네일 URL 및 소스
 */
export async function generateThumbnailUrl(
  githubRepo?: string | null,
  deployUrl?: string | null
): Promise<ThumbnailResult> {
  // 1. GitHub 레포가 있으면 Open Graph 이미지 사용 (즉시)
  if (githubRepo?.trim()) {
    return {
      url: `https://opengraph.githubassets.com/1/${githubRepo.trim()}`,
      source: 'github',
    }
  }

  // 2. 배포 URL이 있으면 Microlink API로 스크린샷 캡처
  if (deployUrl?.trim()) {
    try {
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(deployUrl.trim())}&screenshot=true&meta=false`
      const response = await fetch(microlinkUrl, {
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.data?.screenshot?.url) {
          return {
            url: data.data.screenshot.url,
            source: 'screenshot',
          }
        }
      }
    } catch {
      // Microlink 실패 시 무시
    }
  }

  return { url: null, source: null }
}

/**
 * 프로젝트 생성/수정 시 썸네일 자동 생성 여부 판단 및 생성
 *
 * @param existingThumbnail - 기존 또는 입력된 썸네일 URL
 * @param githubRepo - GitHub 레포지토리
 * @param deployUrl - 배포 URL
 * @returns 최종 썸네일 URL (기존값 유지 또는 새로 생성)
 */
export async function resolveProjectThumbnail(
  existingThumbnail?: string | null,
  githubRepo?: string | null,
  deployUrl?: string | null
): Promise<string | null> {
  // 이미 썸네일이 있으면 유지 (수동 설정 우선)
  if (existingThumbnail?.trim()) {
    return existingThumbnail.trim()
  }

  // 자동 생성 시도
  const result = await generateThumbnailUrl(githubRepo, deployUrl)
  return result.url
}
